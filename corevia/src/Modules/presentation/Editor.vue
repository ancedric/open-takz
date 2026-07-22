<template>
  <div class="editor-container" v-if="!loading">
    <!-- Header inchangé, mais vérifié -->
    <header class="editor-header">
      <div class="header-left">
        <button @click="$router.push('/home/presentation')" class="btn-back">
          <i class="pi pi-arrow-left"></i>
        </button>
        <input v-if="presentation" v-model="presentation.title" @blur="updateTitle" class="title-input" />
      </div>
      <div class="header-actions">
        <button @click="addText" class="btn-tool"><i class="pi pi-text-color"></i> Texte</button>
        <button @click="addImage" class="btn-tool"><i class="pi pi-image"></i> Image</button>
        <div class="divider"></div>
        <div class="theme-selector">
          <select :value="presentation?.theme_config?.id" @change="e => applyTheme(themes.find(t => t.id === e.target.value))" class="select-design">
            <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <button @click="exportPDF" class="btn-export">PDF</button>
        <button @click="exportPPTX" class="btn-export primary">PPTX</button>
      </div>
    </header>

    <div class="editor-body">
      <!-- Sidebar Slides -->
      <aside class="slides-sidebar">
        <div v-for="(slide, index) in slides" :key="slide.id" class="slide-thumb" :class="{ active: currentSlideIndex === index }" @click="currentSlideIndex = index">
          <span class="slide-number">{{ index + 1 }}</span>
          <div class="thumb-preview" :style="getSlideStyle(slide)">
            <div v-for="el in slide.elements" :key="el.id" :style="getMiniatureStyle(el)">
              {{ el.type === 'text' ? el.content : '🖼️' }}
            </div>
          </div>
        </div>
        <!-- Dans la sidebar gauche (slides-sidebar) -->
        <div class="layout-selector">
          <label>Layouts</label>
          <div class="layout-grid">
            <button @click="applyLayout('TITLE_SLIDE')" class="btn-layout-mini" title="Titre">
              <div class="mini-box title"></div>
            </button>
            <button @click="applyLayout('CONTENT_TEXT')" class="btn-layout-mini" title="Texte">
              <div class="mini-box text"></div>
            </button>
            <button @click="applyLayout('TWO_COLUMNS')" class="btn-layout-mini" title="2 Colonnes">
              <div class="mini-box cols"></div>
            </button>
            <button @click="applyLayout('IMAGE_CAPTION')" class="btn-layout-mini" title="Image + Texte">
              <div class="mini-box img-txt"></div>
            </button>
          </div>
        </div>
        <button @click="addNewSlide" class="btn-add-slide">+ Nouvelle slide</button>
      </aside>

      <!-- Zone d'édition (Canvas) -->
      <main class="canvas-area" @mousedown="deselectAll">
        <div class="canvas-wrapper">
          <div id="active-slide" class="main-slide" :style="getSlideStyle(currentSlide)">
            <div v-if="activeGuides.x !== null" class="guide-line v-line" :style="{ left: activeGuides.x + 'px' }"></div>
            <div v-if="activeGuides.y !== null" class="guide-line h-line" :style="{ top: activeGuides.y + 'px' }"></div>
            <div
              v-for="el in currentSlide.elements"
              :key="el.id"
              class="editable-element"
              :class="{ 'is-selected': selectedElement?.id === el.id, 'is-editing': isEditingText && selectedElement?.id === el.id }"
              :style="getElementStyle(el)"
              @mousedown.stop="selectElement(el, $event)"
              @dblclick.stop="enableEditing(el)"
            >
              <!-- Box de sélection (visible uniquement si sélectionné ET pas en cours d'édition de texte) -->
              <div v-if="selectedElement?.id === el.id && !isEditingText" class="selection-box">
                  <div class="handle top-left"></div>
                  <div class="handle top-right"></div>
                  <div class="handle bottom-left"></div>
                  <div class="handle bottom-right"></div>
              </div>

              <!-- Rendu de l'élément -->
              <div 
                v-if="el.type === 'text'" 
                :contenteditable="isEditingText && selectedElement?.id === el.id"
                @blur="e => { el.content = e.target.innerText; isEditingText = false; savePresentation(); }"
                class="text-content"
                @mousedown.stop 
              >{{ el.content }}</div>
              
              <img v-else-if="el.type === 'image'" :src="el.content" :style="{ width: '100%', height: 'auto', display: 'block' }" />
            </div>
          </div>
        </div>
      </main>

      <!-- Panneau des Propriétés-->
      <aside class="properties-panel" :class="{ 'collapsed': isPanelCollapsed }" @mousedown.stop>
  
        <!-- Bouton de réduction -->
        <button @click="togglePanel" class="btn-toggle-panel" :title="isPanelCollapsed ? 'Ouvrir' : 'Réduire'">
          <i :class="isPanelCollapsed ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"></i>
        </button>

        <div v-if="!isPanelCollapsed" class="panel-content-wrapper">
          <!-- CAS 1 : C'est un TEXTE -->
          <div v-if="selectedElement && selectedElement.type === 'text'" class="text-tools">
            <div class="panel-header">
              <h4>Texte</h4>
              <button @click="selectedElement = null" class="btn-close-panel">&times;</button>
            </div>
            
            <p v-if="!isEditingText" class="edit-hint">Double-cliquez pour modifier le texte</p>

            <div class="prop-group">
              <label>Police</label>
              <select :value="selectedElement.style.fontFamily" @change="updateElementStyle('fontFamily', $event.target.value)" class="font-select">
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font.split(',')[0] }}</option>
              </select>
            </div>

            <div class="prop-row">
              <div class="prop-group">
                <label>Taille</label>
                <input type="number" :value="selectedElement.style.fontSize || 24" @input="updateFontSize" class="size-input" />
              </div>
              <div class="prop-group">
                <label>Couleur</label>
                <input type="color" :value="selectedElement.style.color || '#000000'" @input="updateElementStyle('color', $event.target.value)" class="color-input" />
              </div>
            </div>

            <div class="prop-group">
              <label>Format</label>
              <div class="toolbar-btns">
                <button @click="toggleTextStyle('fontWeight')" :class="{ active: selectedElement.style.fontWeight === 'bold' }" class="btn-format"><i class="pi pi-bold"></i></button>
                <button @click="toggleTextStyle('fontStyle')" :class="{ active: selectedElement.style.fontStyle === 'italic' }" class="btn-format"><i class="pi pi-italic"></i></button>
                <button @click="toggleTextStyle('textDecoration')" :class="{ active: selectedElement.style.textDecoration === 'underline' }" class="btn-format"><i class="pi pi-underline"></i></button>
              </div>
            </div>

            <div class="prop-group">
              <label>Alignement</label>
              <div class="toolbar-btns">
                <button v-for="align in ['left', 'center', 'right']" :key="align" @click="updateElementStyle('textAlign', align)" :class="{ active: selectedElement.style.textAlign === align }" class="btn-format">
                  <i :class="'pi pi-align-' + align"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- CAS 2 : C'est une IMAGE -->
          <div v-else-if="selectedElement && selectedElement.type === 'image'" class="image-tools">
            <div class="panel-header">
              <h4>Image</h4>
              <button @click="selectedElement = null" class="btn-close-panel">&times;</button>
            </div>
            <div class="prop-group" style="padding: 1rem;">
              <label>Largeur (px)</label>
              <input type="number" :value="selectedElement.style.width" @input="e => updateElementStyle('width', parseInt(e.target.value))" class="size-input" />
            </div>
          </div>

          <div class="prop-group">
            <label>Alignement Slide</label>
            <div class="alignment-grid">
              <!-- Alignement Horizontal -->
              <div class="toolbar-btns">
                <button @click="alignElement('left')" class="btn-format" title="Aligner à gauche">
                  <i class="pi pi-align-left"></i>
                </button>
                <button @click="alignElement('center-h')" class="btn-format" title="Centrer horizontalement">
                  <i class="pi pi-arrows-h"></i>
                </button>
                <button @click="alignElement('right')" class="btn-format" title="Aligner à droite">
                  <i class="pi pi-align-right"></i>
                </button>
              </div>
              
              <!-- Alignement Vertical -->
              <div class="toolbar-btns" style="margin-top: 8px;">
                <button @click="alignElement('top')" class="btn-format" title="Aligner en haut">
                  <i class="pi pi-angle-double-up"></i>
                </button>
                <button @click="alignElement('center-v')" class="btn-format" title="Centrer verticalement">
                  <i class="pi pi-arrows-v"></i>
                </button>
                <button @click="alignElement('bottom')" class="btn-format" title="Aligner en bas">
                  <i class="pi pi-angle-double-down"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="prop-group">
            <label>Disposition</label>
            <div class="layers-controls">
              <div class="toolbar-btns">
                <button @click="moveZIndex('front')" class="btn-format" title="Mettre au premier plan">
                  <i class="pi pi-clone"></i> <!-- Icône pour 'tout devant' -->
                </button>
                <button @click="moveZIndex('forward')" class="btn-format" title="Avancer d'un plan">
                  <i class="pi pi-chevron-up"></i>
                </button>
                <button @click="moveZIndex('backward')" class="btn-format" title="Reculer d'un plan">
                  <i class="pi pi-chevron-down"></i>
                </button>
                <button @click="moveZIndex('back')" class="btn-format" title="Mettre à l'arrière-plan">
                  <i class="pi pi-box"></i> <!-- Icône pour 'tout derrière' -->
                </button>
              </div>
            </div>
          </div>
          <button @click="deleteElement" class="btn-delete-el">
            <i class="pi pi-trash"></i> Supprimer l'élément
          </button>
        </div>
      </aside>
      <!-- CAS 3 : Rien n'est sélectionné -> Design de la Slide -->
          <aside class="properties-panel" :class="{ 'collapsed': isPanelCollapsed }" v-if="!selectedElement" @mousedown.stop>
            <button @click="togglePanel" class="btn-toggle-panel" :title="isPanelCollapsed ? 'Ouvrir' : 'Réduire'">
              <i :class="isPanelCollapsed ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"></i>
            </button>
              <div class="panel-header"><h4>Design Slide</h4></div>
              <div class="prop-group" style="padding: 1rem;">
                <label>Arrière-plan</label>
                <input type="color" :value="currentSlide.background_config?.value || '#ffffff'" @input="e => updateSlideBackground(e.target.value)" class="color-picker-large" />
                <button @click="resetBackground" class="btn-reset-bg">Réinitialiser au thème</button>
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

const activeGuides = ref({ x: null, y: null });
const snapThreshold = 5;

const isPanelCollapsed = ref(false);

const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value;
};

const currentSlide = computed(() => slides.value[currentSlideIndex.value] || {});

const themes = ref([
  { 
    id: 'modern', 
    name: 'Moderne', 
    font: 'Poppins, sans-serif', 
    bg: '#ffffff', 
    text: '#1e293b', 
    accent: '#2563eb' 
  },
  { 
    id: 'dark_pro', 
    name: 'Sombre Pro', 
    font: 'Inter, sans-serif', 
    bg: '#0f172a', 
    text: '#f8fafc', 
    accent: '#38bdf8' 
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    font: 'Merriweather, serif', 
    bg: '#fff7ed', 
    text: '#431407', 
    accent: '#ea580c' 
  }
]);
const layoutTemplates = {
  TITLE_SLIDE: [
    { type: 'text', content: 'TITRE PRINCIPAL', x: 50, y: 140, style: { fontSize: 50, fontWeight: 'bold', textAlign: 'center', width: 600 } },
    { type: 'text', content: 'Sous-titre ou présentation', x: 150, y: 220, style: { fontSize: 24, color: '#64748b', textAlign: 'center', width: 400 } }
  ],
  CONTENT_TEXT: [
    { type: 'text', content: 'Titre de la section', x: 40, y: 30, style: { fontSize: 32, fontWeight: 'bold', width: 620 } },
    { type: 'text', content: '• Premier point clé\n• Deuxième argument\n• Conclusion locale', x: 40, y: 100, style: { fontSize: 20, width: 620 } }
  ],
  TWO_COLUMNS: [
    { type: 'text', content: 'Comparaison', x: 40, y: 30, style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', width: 620 } },
    { type: 'text', content: 'Arguments Pour', x: 40, y: 120, style: { fontSize: 18, width: 300, color: '#16a34a' } },
    { type: 'text', content: 'Arguments Contre', x: 360, y: 120, style: { fontSize: 18, width: 300, color: '#dc2626' } }
  ],
  IMAGE_CAPTION: [
    { type: 'text', content: 'Analyse d\'image', x: 40, y: 30, style: { fontSize: 28, fontWeight: 'bold' } },
    { type: 'image', content: 'https://via.placeholder.com/400x250', x: 40, y: 80, style: { width: 400 } },
    { type: 'text', content: 'Description détaillée de ce que nous voyons sur l\'illustration à gauche.', x: 460, y: 100, style: { fontSize: 16, width: 200 } }
  ]
};  

// Appliquer un thème à la présentation
const applyTheme = async (theme) => {
  if (!theme || !presentation.value) return;
  
  // 1. Mise à jour de la config globale
  presentation.value.theme_config = { 
    id: theme.id, 
    font: theme.font, 
    bg: theme.bg,
    colors: { text: theme.text, accent: theme.accent } 
  };
  
  // 2. OPTIONNEL : Si tu veux que toutes les slides existantes 
  // perdent leur couleur de fond personnalisée pour adopter celle du thème
  slides.value.forEach(slide => {
    slide.background_config = { type: 'theme', value: null };
  });

  // 3. Sauvegarde de la présentation
  await supabase
    .from('presentations')
    .update({ theme_config: presentation.value.theme_config })
    .eq('id', presentation.value.id);

  // 4. Sauvegarde groupée des slides pour réinitialiser les fonds (si étape 2 activée)
  // Sinon, appelle juste savePresentation() pour synchroniser
  savePresentation();
};

const applyLayout = (layoutKey) => {
  if (!currentSlide.value) return;
  
  if (currentSlide.value.elements.length > 0) {
    if (!confirm("Appliquer un layout remplacera le contenu actuel. Continuer ?")) return;
  }

  const template = layoutTemplates[layoutKey];
  
  // On clone le template pour éviter les références partagées
  currentSlide.value.elements = template.map(el => ({
    ...el,
    id: Date.now() + Math.random(), // ID unique
    style: { ...el.style }
  }));

  savePresentation();
};

const resetBackground = async () => {
  currentSlide.value.background_config = { type: 'theme', value: null };
  saveSlideBackground();
};

// Fonction pour changer le fond de la slide actuelle uniquement
const getSlideStyle = (slide) => {
  if (!slide || !presentation.value) return {};
  
  const theme = presentation.value.theme_config;
  const bg = slide.background_config?.value || theme?.bg || '#ffffff';
  const font = theme?.font || 'Arial, sans-serif';
  const textColor = theme?.colors?.text || '#000000';

  return {
    backgroundColor: bg,
    fontFamily: font,
    color: textColor, // Applique la couleur de texte du thème
    transition: 'all 0.3s ease'
  };
};

const updateSlideBackground = async (color) => {
  currentSlide.value.background_config = { type: 'color', value: color };
  saveSlideBackground();
};

const saveSlideBackground = async () => {
    await supabase
    .from('slides')
    .update({ background_config: currentSlide.value.background_config })
    .eq('id', currentSlide.value.id);
};

const moveZIndex = (direction) => {
  if (!selectedElement.value) return;

  const els = currentSlide.value.elements;
  const index = els.findIndex(el => el.id === selectedElement.value.id);

  if (direction === 'forward' && index < els.length - 1) {
    // On échange avec l'élément suivant (monte d'un cran)
    [els[index], els[index + 1]] = [els[index + 1], els[index]];
  } 
  else if (direction === 'backward' && index > 0) {
    // On échange avec l'élément précédent (descend d'un cran)
    [els[index], els[index - 1]] = [els[index - 1], els[index]];
  } 
  else if (direction === 'front') {
    // On le déplace à la toute fin du tableau
    const element = els.splice(index, 1)[0];
    els.push(element);
  } 
  else if (direction === 'back') {
    // On le déplace au tout début du tableau
    const element = els.splice(index, 1)[0];
    els.unshift(element);
  }

  savePresentation();
};
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

const getElementStyle = (el) => {
  const baseStyle = {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
  };

  if (el.type === 'text') {
    // On récupère les valeurs du thème en repli (fallback)
    const themeFont = presentation.value?.theme_config?.font || 'Arial, sans-serif';
    const themeColor = presentation.value?.theme_config?.colors?.text || '#000000';

    return {
      ...baseStyle,
      fontSize: (el.style.fontSize || 24) + 'px',
      fontWeight: el.style.fontWeight || 'normal',
      fontStyle: el.style.fontStyle || 'normal',
      textDecoration: el.style.textDecoration || 'none',
      textAlign: el.style.textAlign || 'left',
      // PRIORITÉ : Style de l'élément > Thème
      fontFamily: el.style.fontFamily || themeFont,
      color: el.style.color || themeColor,
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
  // Ratio : Canvas (700px) / Sidebar (env. 200px) = 3.5
  const ratio = 3.5; 
  
  return {
    position: 'absolute',
    left: (el.x / ratio) + 'px', 
    top: (el.y / ratio) + 'px',
    fontSize: Math.max((el.style.fontSize / ratio), 4) + 'px', // On évite que le texte disparaisse
    color: el.style.color || '#334155',
    textAlign: el.style.textAlign || 'left',
    fontWeight: el.style.fontWeight || 'normal',
    fontStyle: el.style.fontStyle || 'normal',
    textDecoration: el.style.textDecoration || 'none',
    width: el.type === 'text' ? '100px' : (el.style.width / ratio) + 'px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    pointerEvents: 'none',
    lineHeight: '1.2'
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

const alignElement = (position) => {
  if (!selectedElement.value) return;

  const canvasWidth = 700;
  const canvasHeight = 400;
  
  // On récupère les dimensions réelles de l'élément via le DOM pour un centrage parfait
  const elDom = document.querySelector('.is-selected');
  const elWidth = elDom?.offsetWidth || 0;
  const elHeight = elDom?.offsetHeight || 0;

  switch (position) {
    case 'left':
      selectedElement.value.x = 0;
      break;
    case 'center-h':
      selectedElement.value.x = (canvasWidth / 2) - (elWidth / 2);
      break;
    case 'right':
      selectedElement.value.x = canvasWidth - elWidth;
      break;
    case 'top':
      selectedElement.value.y = 0;
      break;
    case 'center-v':
      selectedElement.value.y = (canvasHeight / 2) - (elHeight / 2);
      break;
    case 'bottom':
      selectedElement.value.y = canvasHeight - elHeight;
      break;
  }
  
  savePresentation();
};

// Fonctions vides pour l'instant pour éviter les erreurs au clic
const exportPDF = () => alert("Export PDF bientôt disponible !");
const exportPPTX = () => alert("Export PPTX bientôt disponible !");

// --- LOGIQUE DE SELECTION & DRAG ---

const selectElement = (el, event) => {
  if (isEditingText.value && selectedElement.value?.id === el.id) return;
  
  selectedElement.value = el;
  draggingElement.value = el;
  
  // On ne coupe pas isEditingText ici pour permettre le passage au double-clic
  
  const canvas = document.getElementById('active-slide');
  const rect = canvas.getBoundingClientRect();
  offset.x = event.clientX - rect.left - el.x;
  offset.y = event.clientY - rect.top - el.y;

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};

// Nouvelle fonction pour le double-clic
const enableEditing = (el) => {
  if (el.type === 'text') {
    isEditingText.value = true;
    // Petit délai pour laisser Vue ajouter l'attribut contenteditable
    setTimeout(() => {
      const elDom = document.querySelector('.is-editing .text-content');
      if (elDom) {
        elDom.focus();
        // Place le curseur à la fin
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(elDom);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }
};

const handleMouseMove = (event) => {
  if (!draggingElement.value || isEditingText.value) return;

  const canvas = document.getElementById('active-slide');
  const rect = canvas.getBoundingClientRect();

  // Coordonnées cibles avant aimantation
  let newX = event.clientX - rect.left - offset.x;
  let newY = event.clientY - rect.top - offset.y;

  const canvasWidth = 700;
  const canvasHeight = 400;
  
  // Reset des guides
  activeGuides.value = { x: null, y: null };

  // --- Aimantation Horizontale (Axe X - Centre) ---
  const centerX = canvasWidth / 2;
  // On calcule par rapport au milieu de l'élément (el.x + largeur/2) 
  // Ici on simplifie sur le bord gauche pour l'exemple, ou le centre si tu as la largeur
  if (Math.abs(newX - (centerX - 50)) < snapThreshold) { // 50 est une estimation de demi-largeur
    newX = centerX - 50;
    activeGuides.value.x = centerX;
  }

  // --- Aimantation Verticale (Axe Y - Centre) ---
  const centerY = canvasHeight / 2;
  if (Math.abs(newY - (centerY - 15)) < snapThreshold) {
    newY = centerY - 15;
    activeGuides.value.y = centerY;
  }

  // Application des positions
  draggingElement.value.x = newX;
  draggingElement.value.y = newY;
};

const handleMouseUp = () => {
  draggingElement.value = null;
  activeGuides.value = { x: null, y: null }; // On cache les lignes
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  savePresentation();
};

// Désélectionner quand on clique sur le fond du canvas
const deselectAll = (event) => {
  // IMPORTANT : On ne désélectionne pas si on clique sur un bouton du panneau
  if (event.target.closest('.properties-panel') || event.target.closest('.btn-tool')) return;

  // On désélectionne si on clique sur le fond gris ou le fond de la slide vide
  if (event.target.id === 'active-slide' || event.target.classList.contains('canvas-area')) {
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
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        if (!currentSlide.value || !currentSlide.value.id) return;
        
        await supabase
            .from('slides')
            .update({ 
                elements: currentSlide.value.elements,
                background_config: currentSlide.value.background_config 
            })
            .eq('id', currentSlide.value.id);
            
    }, 800); 
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
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: white; /* Fond par défaut si pas de config */
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden; /* Très important pour ne pas dépasser */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex; /* Assure que le contenu s'aligne bien */
}

.thumb-preview {
  width: 100%;
  height: 100%;
  position: relative;
  /* Supprime le transform: scale(0.2) qui écrase tout dans un coin */
  background-size: cover !important;
  background-position: center !important;
}

.slide-number {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(15, 23, 42, 0.8); /* Plus opaque pour la lisibilité */
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10; /* Doit être au-dessus du contenu de la slide */
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

/* État normal du panneau */
.properties-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 280px; /* Largeur pleine */
  height: calc(100% - 100px);
  z-index: 100;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* Animation fluide */
  overflow: visible; /* Pour laisser dépasser le bouton de toggle */
}

/* État réduit */
.properties-panel.collapsed {
  width: 45px; /* Largeur minimale pour laisser voir le bouton */
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
}

/* Le bouton pour réduire/ouvrir */
.btn-toggle-panel {
  position: absolute;
  left: -15px; /* Chevauche légèrement le bord gauche */
  top: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 110;
  transition: transform 0.2s;
}

.btn-toggle-panel:hover {
  transform: scale(1.1);
  background: #1d4ed8;
}

/* Wrapper interne pour éviter les sauts de texte pendant l'animation */
.panel-content-wrapper {
  width: 280px; /* Fixe pour que le contenu ne saute pas */
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-sizing: border-box;
  overflow-y: auto;
}

/* On cache la scrollbar du panneau pour un look plus propre */
.panel-content-wrapper::-webkit-scrollbar {
  width: 4px;
}
.panel-content-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
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
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
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
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Espace constant entre les vignettes */
  overflow-y: auto; /* Active le scroll vertical */
}

.slide-thumb {
  position: relative;
  width: 100%;
  min-height: 110px; /* Force une hauteur minimum pour éviter l'écrasement */
  aspect-ratio: 16/9;
  flex-shrink: 0; /* EMPECHE l'écrasement ! Important */
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
  position: relative;
  overflow: hidden;
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

.select-design {
  background: #1e293b;
  color: white;
  border: 1px solid #334155;
  padding: 0.5rem;
  border-radius: 6px;
  outline: none;
  font-size: 0.85rem;
}

.color-picker-large {
  width: 100%;
  height: 45px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px;
  background: white;
}

.btn-reset-bg {
  width: 100%;
  margin-top: 8px;
  background: none;
  border: 1px solid #cbd5e1;
  padding: 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  color: #64748b;
}

.btn-reset-bg:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.theme-selector {
  display: flex;
  align-items: center;
  background: #1e293b;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #334155;
}

.edit-hint {
  font-size: 0.75rem;
  color: #2563eb;
  background: #eff6ff;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #dbeafe;
}

.guide-line {
  position: absolute;
  background-color: #38bdf8; /* Couleur cyan */
  z-index: 50;
  pointer-events: none; /* Ne pas gêner le clic */
}

.v-line {
  width: 1px;
  height: 100%;
  top: 0;
}

.h-line {
  height: 1px;
  width: 100%;
  left: 0;
}

.alignment-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alignment-grid .toolbar-btns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.pi {
  font-size: 0.9rem;
}

.layers-controls .toolbar-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.layers-controls .btn-format i {
  font-size: 0.8rem;
}

.layout-selector {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.layout-selector label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  display: block;
  margin-bottom: 0.5rem;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.btn-layout-mini {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-layout-mini:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

/* Dessins minimalistes des layouts */
.mini-box {
  height: 30px;
  background: #f1f5f9;
  position: relative;
  border-radius: 2px;
}

.mini-box.title::after {
  content: ''; position: absolute; top: 12px; left: 15%; width: 70%; height: 6px; background: #cbd5e1;
}

.mini-box.cols::before {
  content: ''; position: absolute; top: 5px; left: 10%; width: 35%; height: 20px; background: #cbd5e1;
}
.mini-box.cols::after {
  content: ''; position: absolute; top: 5px; right: 10%; width: 35%; height: 20px; background: #cbd5e1;
}
</style>