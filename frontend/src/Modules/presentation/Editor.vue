<template>
  <div class="editor-container" v-if="!loading">
    <header class="editor-header">
      <div class="header-left">
        <button @click="$router.push('/presentation')" class="btn-back" style="background:none; border:none; color:white; cursor:pointer;">
          <i class="pi pi-arrow-left"></i>
        </button>
        <input v-if="presentation" v-model="presentation.title" @blur="updateTitle" class="title-input" />
      </div>
      <div class="header-actions">
        <button @click="addText" class="btn-tool"><i class="pi pi-text-color"></i> Texte</button>
        <button @click="addImage" class="btn-tool"><i class="pi pi-image"></i> Image</button>
        <div class="divider"></div>
        <button @click="exportPDF" class="btn-export">PDF</button>
        <button @click="exportPPTX" class="btn-export primary">PPTX</button>
      </div>
    </header>

    <div class="editor-body">
      <aside class="slides-sidebar">
        <div 
          v-for="(slide, index) in slides" 
          :key="slide.id"
          class="slide-thumb"
          :class="{ active: currentSlideIndex === index }"
          @click="currentSlideIndex = index"
        >
          <span class="slide-number">{{ index + 1 }}</span>
          <div class="thumb-preview" :style="getSlideStyle(slide)">
            <div 
              v-for="el in slide.elements" 
              :key="el.id"
              :style="getMiniatureStyle(el)"
            >
              {{ el.type === 'text' ? el.content : '🖼️' }}
            </div>
          </div>
        </div>
        <button @click="addNewSlide" class="btn-add-slide">+ Nouvelle slide</button>
      </aside>

      <main class="canvas-area" @mousedown="deselectAll">
        <div class="canvas-wrapper">
          <div 
            id="active-slide"
            class="main-slide" 
            :style="getSlideStyle(currentSlide)"
          >
            <div
              v-for="el in currentSlide.elements"
              :key="el.id"
              class="editable-element"
              :class="{ 'is-selected': selectedElement?.id === el.id, 'is-editing': isEditingText && selectedElement?.id === el.id }"
              :style="getElementStyle(el)"
              @mousedown.stop="selectElement(el, $event)"
              @dblclick.stop="enableEditing(el)"
            >
              <div v-if="selectedElement?.id === el.id && !isEditingText" class="selection-box">
                  <div class="handle top-left"></div>
                  <div class="handle top-right"></div>
                  <div class="handle bottom-left"></div>
                  <div class="handle bottom-right"></div>
              </div>

              <div 
                v-if="el.type === 'text'" 
                :contenteditable="isEditingText && selectedElement?.id === el.id"
                @blur="el.content = $event.target.innerText; isEditingText = false; savePresentation()"
                class="text-content"
                @mousedown.stop 
              >{{ el.content }}</div>
              
              <img v-else-if="el.type === 'image'" :src="el.content" draggable="false" />
            </div>
          </div>
        </div>
      </main>

      <aside class="properties-panel" v-if="selectedElement && isEditingText">

        <div v-if="selectedElement.type === 'text' && isEditingText" class="text-tools">
            <div class="panel-header">
              <h4>Propriétés</h4>
              <button @click="selectedElement = null" class="btn-close-panel">&times;</button>
            </div>
            <div class="prop-group">
                <label>Police</label>
                <select 
                    :value="selectedElement.style.fontFamily || 'Arial, sans-serif'"
                    @change="updateElementStyle('fontFamily', $event.target.value)"
                    class="font-select"
                >
                    <option v-for="font in availableFonts" :key="font" :value="font">
                        {{ font.split(',')[0] }}
                    </option>
                </select>
            </div>

            <div class="prop-row">
                <div class="prop-group">
                    <label>Taille</label>
                    <input 
                        type="number" 
                        :value="selectedElement.style.fontSize || 24" 
                        @input="updateFontSize"
                        min="8" max="144"
                        class="size-input"
                    />
                </div>
                <div class="prop-group">
                    <label>Couleur</label>
                    <input 
                        type="color" 
                        :value="selectedElement.style.color || '#000000'" 
                        @input="updateElementStyle('color', $event.target.value)"
                        class="color-input"
                    />
                </div>
            </div>

            <div class="prop-group">
                <label>Mise en forme</label>
                <div class="toolbar-btns">
                    <button @click="toggleTextStyle('fontWeight')" :class="{ active: selectedElement.style.fontWeight === 'bold' }" class="btn-format"><i class="pi pi-bold"></i></button>
                    <button @click="toggleTextStyle('fontStyle')" :class="{ active: selectedElement.style.fontStyle === 'italic' }" class="btn-format"><i class="pi pi-italic"></i></button>
                    <button @click="toggleTextStyle('textDecoration')" :class="{ active: selectedElement.style.textDecoration === 'underline' }" class="btn-format"><i class="pi pi-underline"></i></button>
                </div>
            </div>

            <div class="prop-group">
                <label>Alignement</label>
                <div class="toolbar-btns">
                    <button v-for="align in ['left', 'center', 'right', 'justify']" :key="align" @click="updateElementStyle('textAlign', align)" :class="{ active: selectedElement.style.textAlign === align }" class="btn-format">
                        <i :class="'pi pi-align-' + align"></i>
                    </button>
                </div>
            </div>
            <button @click="deleteElement" class="btn-delete-el">
                <i class="pi pi-trash"></i> Supprimer
            </button>
        </div>
        <div v-else-if="selectedElement.type === 'text' && !isEditingText" class="selection-info">
            <p style="font-size: 0.8rem; color: #64748b; text-align: center;">
              Double-cliquez pour éditer le texte
            </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../../services/supabaseConfig';

const route = useRoute();
const loading = ref(true);
const presentation = ref(null);
const slides = ref([]);
const currentSlideIndex = ref(0);
const selectedElement = ref(null);

const draggingElement = ref(null);
const offset = { x: 0, y: 0 };
const isEditingText = ref(false);

const currentSlide = computed(() => slides.value[currentSlideIndex.value] || {});

const fetchData = async () => {
  const { id } = route.params;
  
  // Récupérer la prez
  const { data: pres } = await supabase.from('presentations').select('*').eq('id', id).single();
  presentation.value = pres;

  // Récupérer les slides
  const { data: sld } = await supabase.from('slides').select('*').eq('presentation_id', id).order('order_index');
  slides.value = sld;
  
  loading.value = false;
};

const getSlideStyle = (slide) => {
  if (!slide || !slide.background_config) return {};
  return {
    background: slide.background_config.value,
    fontFamily: presentation.value.theme_config.font
  };
};

const getElementStyle = (el) => {
  const baseStyle = {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
  };

  if (el.type === 'text') {
    return {
      ...baseStyle,
      fontSize: (el.style.fontSize || 24) + 'px',
      color: el.style.color || '#000000',
      fontWeight: el.style.fontWeight || 'normal',
      fontStyle: el.style.fontStyle || 'normal', // Correction : c'est fontStyle pour l'italique
      textDecoration: el.style.textDecoration || 'none',
      textAlign: el.style.textAlign || 'left',
      fontFamily: el.style.fontFamily || 'Arial',
      minWidth: '150px', 
      display: 'block'
    };
  }

  if (el.type === 'image') {
    return {
      ...baseStyle,
      width: el.style.width ? el.style.width + 'px' : 'auto'
    };
  }

  return baseStyle;
};

const getMiniatureStyle = (el) => {
  return {
    position: 'absolute',
    left: (el.x / 4) + 'px', 
    top: (el.y / 4) + 'px',
    fontSize: '5px',
    color: el.style.color || '#334155',
    textAlign: el.style.textAlign || 'left',
    fontWeight: el.style.fontWeight || 'normal',
    fontStyle: el.style.fontStyle || 'normal',
    width: '100px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    pointerEvents: 'none'
  };
};

const addText = () => {
  // 1. On vérifie si la slide actuelle existe
  if (!currentSlide.value) return;

  // 2. Initialisation sécurisée de l'array elements s'il est null/undefined
  if (!currentSlide.value.elements) {
    currentSlide.value.elements = [];
  }

  // 3. Ajout de l'élément
  currentSlide.value.elements.push({
    id: Date.now(), 
    type: 'text',
    content: 'Nouveau texte',
    x: 100, 
    y: 100,
    style: { 
      fontSize: 24, 
      color: '#000000', 
      fontWeight: 'normal',
      fontFamily: presentation.value?.theme_config?.font || 'Arial'
    }
  });

  // 4. On sélectionne l'élément pour pouvoir le bouger de suite
  selectedElement.value = currentSlide.value.elements[currentSlide.value.elements.length - 1];
  savePresentation();
};

const addImage = () => {
  if (!currentSlide.value) return;

  const url = prompt("Entrez l'URL de l'image (ex: https://...) :");
  
  if (url) {
    if (!currentSlide.value.elements) currentSlide.value.elements = [];

    currentSlide.value.elements.push({
      id: Date.now(),
      type: 'image',
      content: url,
      x: 150,
      y: 150,
      style: { width: 300 } // On définit une largeur par défaut
    });
  }
   savePresentation();
};

const updateTitle = async () => {
  await supabase
    .from('presentations')
    .update({ title: presentation.value.title })
    .eq('id', presentation.value.id);
};

const addNewSlide = async () => {
  const newOrder = slides.value.length;
  const { data, error } = await supabase
    .from('slides')
    .insert([{
      presentation_id: presentation.value.id,
      order_index: newOrder,
      background_config: { type: 'theme', value: '#ffffff' },
      elements: []
    }])
    .select()
    .single();

  if (!error) {
    slides.value.push(data);
    currentSlideIndex.value = slides.value.length - 1;
    
    // Petit hack pour scroller vers la nouvelle slide après le rendu Vue
    setTimeout(() => {
      const sidebar = document.querySelector('.slides-sidebar');
      sidebar.scrollTo({ top: sidebar.scrollHeight, behavior: 'smooth' });
    }, 100);
  }
};

const deleteElement = () => {
  if (!selectedElement.value) return;
  currentSlide.value.elements = currentSlide.value.elements.filter(el => el.id !== selectedElement.value.id);
  selectedElement.value = null;
  savePresentation();
};

// Fonctions vides pour l'instant pour éviter les erreurs au clic
const exportPDF = () => alert("Export PDF bientôt disponible !");
const exportPPTX = () => alert("Export PPTX bientôt disponible !");

// --- LOGIQUE DE SELECTION & DRAG ---

const selectElement = (el, event) => {
  // Un simple clic sélectionne et prépare le drag, mais n'ouvre pas l'édition
  selectedElement.value = el;
  draggingElement.value = el;
  isEditingText.value = false; // Ferme l'édition si on change d'élément

  const rect = document.getElementById('active-slide').getBoundingClientRect();
  offset.x = event.clientX - rect.left - el.x;
  offset.y = event.clientY - rect.top - el.y;

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};

// Nouvelle fonction pour le double-clic
const enableEditing = (el) => {
  if (el.type === 'text') {
    isEditingText.value = true;
    // On met le focus sur l'élément manuellement après un court délai
    setTimeout(() => {
      const elDom = document.querySelector('.is-editing .text-content');
      if (elDom) elDom.focus();
    }, 50);
  }
};

const handleMouseMove = (event) => {
  if (!draggingElement.value || isEditingText.value) return;

  const canvas = document.getElementById('active-slide');
  const rect = canvas.getBoundingClientRect();

  // Mise à jour de la position relative au canvas
  draggingElement.value.x = event.clientX - rect.left - offset.x;
  draggingElement.value.y = event.clientY - rect.top - offset.y;
};

const handleMouseUp = () => {
  draggingElement.value = null;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  
  // Sauvegarde automatique après déplacement
  savePresentation();
};

// Désélectionner quand on clique sur le fond du canvas
const deselectAll = (event) => {
  // Si on clique sur le panneau de propriétés, on ne fait rien
  if (event.target.closest('.properties-panel')) return;

  if (event.target.id === 'active-slide' || event.target.closest('.canvas-area')) {
    selectedElement.value = null;
    isEditingText.value = false;
  }
};

// --- PROPRIETES DE TEXTE & SAUVEGARDE ---

// Liste des polices disponibles pour Corevia
const availableFonts = ref([
  'Arial, sans-serif',
  'Poppins, sans-serif',
  'Roboto, sans-serif',
  'Merriweather, serif',
  'Courier New, monospace'
]);

// Fonction générique pour mettre à jour le style
const updateElementStyle = (property, value) => {
  if (!selectedElement.value) return;
  
  if (!selectedElement.value.style) selectedElement.value.style = {};
  
  selectedElement.value.style[property] = value;
  
  // Sauvegarde auto après changement de propriété
  savePresentation();
};

// Gestion spécifique de la taille (pour s'assurer que c'est un nombre)
const updateFontSize = (event) => {
  const size = parseInt(event.target.value);
  if (!isNaN(size)) {
    updateElementStyle('fontSize', size);
  }
};

const toggleTextStyle = (styleProperty) => {
  if (!selectedElement.value) return;
  const current = selectedElement.value.style[styleProperty];
  
  let newValue;
  if (styleProperty === 'fontWeight') {
    newValue = current === 'bold' ? 'normal' : 'bold';
  } else if (styleProperty === 'fontStyle') {
    newValue = current === 'italic' ? 'normal' : 'italic';
  } else if (styleProperty === 'textDecoration') {
    newValue = current === 'underline' ? 'none' : 'underline';
  }
  
  updateElementStyle(styleProperty, newValue);
};

// Sauvegarde auto
let saveTimeout;
const savePresentation = () => {
    // Debounce pour éviter trop d'appels API
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        if (!currentSlide.value) return;
        
        await supabase
            .from('slides')
            .update({ elements: currentSlide.value.elements })
            .eq('id', currentSlide.value.id);
            
    }, 1000); // Sauvegarde 1s après le dernier changement
};

onMounted(fetchData);

// Nettoyage des events au démontage
onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.editor-container {
  height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  height: 60px;
  background: #0f172a; /* Slate 900 */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid #334155;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-input {
  background: transparent;
  border: 1px solid transparent;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.title-input:hover, .title-input:focus {
  background: #1e293b;
  border-color: #475569;
  outline: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-tool {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-tool:hover {
  background: #334155;
  color: white;
}

.btn-tool i {
  font-size: 1rem;
  color: #38bdf8; /* Couleur accentuation */
}

.divider {
  width: 1px;
  height: 24px;
  background: #334155;
  margin: 0 0.5rem;
}

.btn-export {
  background: #334155;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-export.primary {
  background: #2563eb;
}

.btn-export:hover {
  opacity: 0.9;
}

/* On s'assure que le canvas occupe tout l'espace sans bouger */
.editor-body {
  position: relative; /* Référentiel pour le panneau absolu */
  flex: 1;
  display: flex;
  background: #cbd5e1;
  overflow: hidden;
}

/* Sidebar slides */
.slides-sidebar {
  width: 100px;
  background: rgba(255, 255, 255, 0.562);
  border-right: 1px solid #e2e8f0;
  padding: 1rem;
  overflow-y: auto;
}

.slide-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  background: #cbd5e1;
  margin-bottom: 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.slide-thumb.active { border-color: #2563eb; }

/* Canvas Area */
.canvas-area {
  flex: 1;
  overflow: auto; /* Permet de scroller si l'écran est petit */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #cbd5e1; /* Fond plus sombre pour faire ressortir le canvas */
}

.canvas-wrapper {
  width: 700px; 
  height: 400px; 
  min-width: 640px;
  background: white;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.main-slide {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.editable-element {
  cursor: move;
  padding: 4px;
}

.editable-element:hover {
  outline: 1px dashed #2563eb;
}

.properties-panel {
  position: absolute; /* Il flotte */
  right: 20px;
  top: 20px; /* Juste en dessous du header */
  width: 280px;
  height: calc(100% - 100px);
  z-index: 100;
  
  /* Glassmorphism */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow-y: scroll;
}


.editable-element {
  position: absolute;
  cursor: move;
  user-select: none;
  min-width: 50px;
  min-height: 20px;
}

.is-selected .selection-box {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #38bdf8;
  pointer-events: none;
}

.text-content {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-content[contenteditable="true"] {
  cursor: text;
}
.editable-element {
  position: absolute;
  cursor: move;
  user-select: none;
  min-width: 20px;
}

/* Quand on déplace, le texte ne doit pas être sélectionnable */
.editable-element:not(.is-editing) .text-content {
  pointer-events: none;
}

/* Quand on édite, on redonne la main à la souris native */
.editable-element.is-editing {
  cursor: text;
  z-index: 10; /* Passe au dessus lors de l'édition */
}

.editable-element.is-editing .text-content {
  pointer-events: auto;
}

.is-selected .selection-box {
  position: absolute;
  inset: -4px;
  border: 2px solid #38bdf8;
  pointer-events: none;
}

/* Poignées visuelles aux coins */
.handle {
    width: 8px; height: 8px;
    background: white; border: 2px solid #38bdf8;
    position: absolute; border-radius: 50%;
}
.top-left { top: -5px; left: -5px; }
.top-right { top: -5px; right: -5px; }
.bottom-left { bottom: -5px; left: -5px; }
.bottom-right { bottom: -5px; right: -5px; }

.text-content {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
  /* Utilise TextAlign stocké dans le style */
  text-align: inherit; 
}

.panel-header {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.panel-header h4 { margin: 0; font-size: 1.1rem; }
.btn-close-panel { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;}

.text-tools {
    padding: 1rem;
    flex: 1;
}

.prop-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.prop-group { margin-bottom: 1.25rem; }
.prop-group label { display: block; font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; }

.font-select, .size-input {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
}

.color-input {
    width: 100%;
    height: 40px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    cursor: pointer;
    padding: 2px;
}

.toolbar-btns {
    display: flex;
    gap: 4px;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
}

.btn-format {
    flex: 1;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: #475569;
    transition: all 0.2s;
}

.btn-format:hover { background: #e2e8f0; color: #1e293b; }
.btn-format.active { background: #2563eb; color: white; }
.btn-format i { font-size: 1rem; }

.btn-delete-el {
    margin: 1rem;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fee2e2;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    transition: background 0.2s;
}
.btn-delete-el:hover { background: #fee2e2; }
/* Sidebar Slide List */
.slides-sidebar {
  width: 220px;
  background: #f8fafc; /* Gris très léger */
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.slide-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: white;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.slide-thumb:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.slide-thumb.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.slide-number {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(15, 23, 42, 0.6);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 2;
}

.thumb-preview {
  width: 100%;
  height: 100%;
  transform: scale(0.2); /* Miniature */
  transform-origin: top left;
}

/* LE BOUTON NOUVELLE SLIDE */
.btn-add-slide {
  margin-top: 0.5rem;
  background: white;
  color: #2563eb;
  border: 2px dashed #cbd5e1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-add-slide:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1e40af;
}

.btn-add-slide:active {
  transform: scale(0.98);
}
</style>