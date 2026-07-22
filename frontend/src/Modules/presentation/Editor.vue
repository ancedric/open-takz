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
        <div class="insert-menu-wrapper">
          <button @click="showSmartMenu = !showSmartMenu" class="btn-tool accent">
            <i class="pi pi-plus-circle"></i> Objets
          </button>
          
          <div v-if="showSmartMenu" class="insert-dropdown" @click.stop>
            <div class="dropdown-item" @click="insertSmart('chart-pie')">
              <i class="pi pi-chart-pie"></i> Graphique
            </div>
            <div class="dropdown-item" @click="insertSmart('smart-table')">
              <i class="pi pi-table"></i> Tableau
            </div>
            <div class="dropdown-item" @click="insertSmart('org-chart')">
              <i class="pi pi-sitemap"></i> Organigramme
            </div>
            <div class="dropdown-item" @click="insertSmart('progress-bar')">
              <i class="pi pi-bolt"></i> Indicateur
            </div>
          </div>
        </div>
        <button @click="addText" class="btn-tool"><i class="pi pi-text-color"></i> Texte</button>
        <button @click="addImage" class="btn-tool"><i class="pi pi-image"></i> Image</button>
        <div class="divider"></div>
        <div class="theme-selector">
          <select :value="presentation?.theme_config?.id" @change="e => applyTheme(themes.find(t => t.id === e.target.value))" class="select-design">
            <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <button @click="startPresentation" class="btn-present">
          <i class="pi pi-play"></i> Lire
        </button>
        <button @click="exportPDF" class="btn-export" :disabled="isExporting">
          <i v-if="isExporting" class="pi pi-spin pi-spinner"></i>
          {{ isExporting && exportLabel === 'Export PDF...' ? 'Export PDF...' : 'PDF' }}
        </button>
        <button @click="exportPPTX" class="btn-export primary" :disabled="isExporting">
          <i v-if="isExporting" class="pi pi-spin pi-spinner"></i>
          {{ isExporting && exportLabel === 'Export PPTX...' ? 'Export PPTX...' : 'PPTX' }}
        </button>
      </div>
    </header>

    <div class="editor-body">
      <!-- Sidebar Slides -->
      <aside class="slides-sidebar">
        <div v-for="(slide, index) in slides" :key="slide.id" class="slide-thumb" :class="{ 'is-active': index === currentSlideIndex }"
             @click="currentSlideIndex = index; selectedElement = null; isEditingText = false;">
          <span class="slide-number">{{ index + 1 }}</span>
          <div class="thumb-preview" :style="getSlideStyle(slide)">
            <div v-for="el in slide.elements" :key="el.id" :style="getMiniatureStyle(el)">
                <span v-if="el.type === 'text'">{{ el.content }}</span>
                <img v-else-if="el.type === 'image'" :src="el.content" style="width:100%" />
                <div v-else class="miniature-smart-wrapper">
                    <SmartRenderer :element="el" />
                </div>
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
        <div class="canvas-wrapper" ref="canvasWrapper">
          <div id="active-slide" class="main-slide" :style="getSlideStyle(currentSlide)">
            <div v-if="activeGuides.x !== null" class="guide-line v-line" :style="{ left: activeGuides.x + 'px' }"></div>
            <div v-if="activeGuides.y !== null" class="guide-line h-line" :style="{ top: activeGuides.y + 'px' }"></div>
            
            <!-- CORRECTION 1 : Suppression du stop sur SmartRenderer et meilleure gestion des événements -->
            <div
              v-for="el in currentSlide.elements"
              :key="el.id"
              class="editable-element"
              :class="{ 'is-selected': selectedElement?.id === el.id, 'is-editing': isEditingText && selectedElement?.id === el.id }"
              :style="getElementStyle(el)"
              @mousedown.stop="selectElement(el, $event)"
              @dblclick.stop="enableEditing(el)"
            >
              <!-- Box de sélection -->
              <div v-if="selectedElement?.id === el.id && !isEditingText" class="selection-box">
                  <div class="handle top-left" @mousedown.stop="initResize('top-left', $event)"></div>
                  <div class="handle top-right" @mousedown.stop="initResize('top-right', $event)"></div>
                  <div class="handle bottom-left" @mousedown.stop="initResize('bottom-left', $event)"></div>
                  <div class="handle bottom-right" @mousedown.stop="initResize('bottom-right', $event)"></div>
              </div>

              <!-- Rendu de l'élément -->
              <div 
                v-if="el.type === 'text'" 
                :contenteditable="isEditingText && selectedElement?.id === el.id"
                @blur="e => { el.content = e.target.innerText; isEditingText = false; savePresentation(); }"
                class="text-content"
                @mousedown.stop 
              >{{ el.content }}</div>
              
              <img v-else-if="el.type === 'image'" 
                  :src="el.content" 
                  :style="{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', userDrag: 'none' }" />

              <!-- CORRECTION : SmartRenderer sans stop qui bloque tout -->
              <SmartRenderer 
                v-else
                :element="el"
                :style="{ 
                  width: '100%', 
                  height: '100%',
                  pointerEvents: selectedElement?.id === el.id ? 'auto' : 'none'
                }"
                @update-data="handleTableUpdate"
              />
            </div>
          </div>
        </div>
      </main>

      <!-- Panneau des Propriétés-->
      <aside class="properties-panel" v-if="selectedElement">
        <div class="panel-header">
          <div class="header-info">
            <i class="pi pi-sliders-h"></i>
            <h4>Propriétés</h4>
          </div>
          <button @click="selectedElement = null" class="btn-close-panel">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="panel-content-wrapper">
          <div class="element-badge">
            <i :class="getElementIcon(selectedElement.type)" style="font-size: 0.7rem; margin-right: 5px;"></i>
            {{ getFriendlyName(selectedElement.type) }}
          </div>

          <div class="prop-group" v-if="selectedElement.type === 'smart-table' || selectedElement.type.startsWith('chart-')">
            <div class="group-header">
              <i class="pi pi-database"></i>
              <label>Données & Structure</label>
            </div>
            
            <div v-if="selectedElement.type === 'smart-table'" class="table-editor-tools">
              <div class="action-grid">
                <button @click="addTableRow" class="btn-secondary">
                  <i class="pi pi-align-justify"></i> + Ligne
                </button>
                <button @click="addTableCol" class="btn-secondary">
                  <i class="pi pi-bars"></i> + Colonne
                </button>
              </div>
            </div>

            <div v-else-if="selectedElement.type.startsWith('chart-')" class="chart-selector">
              <select v-model="selectedElement.type" @change="savePresentation" class="select-modern">
                <option value="chart-pie">Graphique Circulaire</option>
                <option value="chart-bar">Histogramme</option>
                <option value="chart-line">Courbe</option>
              </select>
            </div>
          </div>
          <div v-if="selectedElement.type === 'org-chart'" class="prop-group">
            <div class="group-header">
              <i class="pi pi-sitemap"></i>
              <label>Structure</label>
            </div>
            
            <div class="action-stack">
              <button @click="addOrgChild" class="btn-secondary">
                <i class="pi pi-plus"></i> Ajouter un subordonné
              </button>
              <button @click="deleteOrgNode" class="btn-danger-light" v-if="selectedElement.selectedNodeId">
                <i class="pi pi-minus"></i> Supprimer ce membre
              </button>
            </div>
            <p class="hint">Cliquez sur un membre dans le canvas pour le cibler.</p>
          </div>
          <div class="prop-group" v-if="selectedElement.type === 'text'">
            <div class="group-header">
              <i class="pi pi-text-color"></i>
              <label>Formatage Texte</label>
            </div>
            
            <div class="text-tools-grid">
              <select :value="selectedElement.style.fontFamily" 
                      @change="e => updateElementStyle('fontFamily', e.target.value)" 
                      class="select-modern full-width">
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font.split(',')[0] }}</option>
              </select>

              <div class="style-grid-modern">
                <div class="style-field">
                  <span>Taille</span>
                  <input type="number" :value="selectedElement.style.fontSize" @input="updateFontSize" class="input-modern" />
                </div>
                <div class="style-field">
                  <span>Couleur</span>
                  <input type="color" v-model="selectedElement.style.color" @input="savePresentation" class="color-picker-modern" />
                </div>
              </div>

              <div class="button-group-row">
                <button @click="toggleTextStyle('fontWeight')" :class="{ 'is-active': selectedElement.style.fontWeight === 'bold' }" class="btn-icon-tool">
                  <i class="pi pi-bold">B</i>
                </button>
                <button @click="toggleTextStyle('fontStyle')" :class="{ 'is-active': selectedElement.style.fontStyle === 'italic' }" class="btn-icon-tool">
                  <i class="pi pi-italic">I</i>
                </button>
                <button @click="toggleTextStyle('textDecoration')" :class="{ 'is-active': selectedElement.style.textDecoration === 'underline' }" class="btn-icon-tool">
                  <i class="pi pi-underline">U</i>
                </button>
              </div>
            </div>
          </div>
          <!-- Animations de l'élément -->
          <div class="prop-group" v-if="selectedElement">
            <div class="group-header">
              <i class="pi pi-star"></i>
              <label>Animation</label>
            </div>
            <div class="style-field">
              <span>Entrée</span>
              <select v-model="selectedElement.animation.type" @change="savePresentation" class="select-modern">
                <option value="none">Aucune</option>
                <option value="fade">Fondu</option>
                <option value="slide-up">Glisser haut</option>
                <option value="slide-left">Glisser gauche</option>
                <option value="zoom">Zoom</option>
                <option value="bounce">Rebond</option>
              </select>
            </div>
            <div class="style-field">
              <span>Durée (ms)</span>
              <input type="number" v-model.number="selectedElement.animation.duration"
                    @change="savePresentation" class="input-modern" min="100" max="3000" step="100" />
            </div>
            <div class="style-field">
              <span>Délai (ms)</span>
              <input type="number" v-model.number="selectedElement.animation.delay"
                    @change="savePresentation" class="input-modern" min="0" max="5000" step="100" />
            </div>
          </div>

          <!-- Transition de la slide -->
          <div class="prop-group" v-if="!selectedElement || selectedElement.type === 'text'">
            <div class="group-header">
              <i class="pi pi-arrows-h"></i>
              <label>Transition slide</label>
            </div>
            <select v-model="currentSlide.transition" @change="savePresentation" class="select-modern">
              <option value="none">Aucune</option>
              <option value="fade">Fondu</option>
              <option value="slide">Glissement</option>
              <option value="zoom">Zoom</option>
              <option value="flip">Retournement</option>
            </select>
          </div>
          <div class="prop-group">
            <div class="group-header">
              <i class="pi pi-palette"></i>
              <label>Style Visuel</label>
            </div>
            <div class="style-grid-modern">
              <div class="style-field">
                <span>Épaisseur</span>
                <div class="input-with-unit">
                  <input type="number" v-model="selectedElement.style.borderWidth" @input="savePresentation" />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="style-field">
                <span>Couleur</span>
                <input type="color" v-model="selectedElement.style.borderColor" @input="savePresentation" class="color-picker-modern" />
              </div>
            </div>
          </div>

          <div class="prop-group actions-group">
            <div class="group-header">
              <i class="pi pi-cog"></i>
              <label>Actions</label>
            </div>
            <button @click="deleteElement" class="btn-danger">
              <i class="pi pi-trash"></i> Supprimer l'élément
            </button>
          </div>
        </div>
      </aside>
    </div>
    <!-- MODE PRÉSENTATION PLEIN ÉCRAN -->
    <div v-if="presentationMode" class="presentation-overlay" @click="nextSlide" @keydown.prevent @keyup.esc="stopPresentation" tabindex="0" ref="presentationContainer">
      <div class="presentation-slide-wrapper">
        <transition :name="slideTransitionName" mode="out-in">
          <div
            :key="presentationIndex"
            class="presentation-slide"
            :style="getSlideStyle(slides[presentationIndex])"
          >
            <!-- CORRECTION 2 : Animation avec style direct -->
            <div
              v-for="(el, elIdx) in slides[presentationIndex].elements"
              :key="el.id"
              :style="{
                ...getElementStyle(el),
                animationDelay: (el.animation?.delay || 0) + 'ms',
                animationDuration: (el.animation?.duration || 500) + 'ms'
              }"
              :class="['pres-element', `anim-${el.animation?.type || 'none'}`]"
            >
              <div v-if="el.type === 'text'" class="text-content" :style="{ pointerEvents: 'none' }">{{ el.content }}</div>
              <img v-else-if="el.type === 'image'" :src="el.content" style="width:100%; height:auto; pointer-events:none;" />
              <SmartRenderer v-else :element="el" :style="{ width: '100%', height: '100%', pointerEvents: 'none' }" />
            </div>
          </div>
        </transition>
      </div>

      <!-- Barre de contrôle -->
      <div class="presentation-controls" @click.stop>
        <button @click="prevSlide" class="pres-btn" :disabled="presentationIndex === 0">
          <i class="pi pi-chevron-left"></i>
        </button>
        <span class="pres-counter">{{ presentationIndex + 1 }} / {{ slides.length }}</span>
        <button @click="nextSlide" class="pres-btn" :disabled="presentationIndex === slides.length - 1">
          <i class="pi pi-chevron-right"></i>
        </button>
        <button @click="stopPresentation" class="pres-btn danger">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../../services/supabaseConfig';
import SmartRenderer from '../../components/SmartRenderer.vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';

const route = useRoute();
const loading = ref(true);
const presentation = ref(null);
const slides = ref([]);
const currentSlideIndex = ref(0);
const selectedElement = ref(null);

const draggingElement = ref(null);
const offset = { x: 0, y: 0 };
const isEditingText = ref(false);
const showSmartMenu = ref(false);
const isExporting = ref(false);
const exportLabel = ref('');

const activeGuides = ref({ x: null, y: null });
const snapThreshold = 5;

const isResizing = ref(false);
const resizeHandle = ref(null);
const initialSize = { width: 0, height: 0, x: 0, y: 0 };
const initialMouse = { x: 0, y: 0 };

const isPanelCollapsed = ref(false);

const presentationMode = ref(false);
const presentationIndex = ref(0);
const slideTransitionName = ref('slide-next');

const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value;
};

const currentSlide = computed(() => slides.value[currentSlideIndex.value] || {});

// Références pour le DOM
const canvasWrapper = ref(null);
const presentationContainer = ref(null);

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

const getElementIcon = (type) => {
  const icons = {
    'text': 'pi pi-text',
    'image': 'pi pi-image',
    'smart-table': 'pi pi-table',
    'chart-pie': 'pi pi-chart-pie',
    'chart-bar': 'pi pi-chart-bar',
    'chart-line': 'pi pi-line-chart',
    'progress-bar': 'pi pi-bolt',
    'org-chart': 'pi pi-sitemap'
  };
  return icons[type] || 'pi pi-box';
};

// Assure-toi que getFriendlyName ne contient plus d'emojis non plus
const getFriendlyName = (type) => {
  const names = {
    'text': 'Texte',
    'image': 'Image',
    'smart-table': 'Tableau',
    'chart-pie': 'Graphique',
    'chart-bar': 'Histogramme',
    'chart-line': 'Courbe',
    'progress-bar': 'Indicateur',
    'org-chart': 'Organigramme'
  };
  return names[type] || 'Élément';
};
// Fonction pour changer le fond de la slide actuelle uniquement
const getSlideStyle = (slide) => {
  if (!slide || !presentation.value) return {};
  
  // On récupère le thème global de la présentation
  const theme = presentation.value.theme_config || themes.value[0];
  
  // Priorité : Couleur spécifique à la slide > Couleur du thème > Blanc
  const bg = slide.background_config?.value || theme?.bg || '#ffffff';
  const font = theme?.font || 'Arial, sans-serif';
  const textColor = theme?.colors?.text || '#000000';

  return {
    backgroundColor: bg,
    fontFamily: font,
    color: textColor,
    transition: 'background-color 0.3s ease'
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
const insertSmart = (type) => {
  let defaultData, defaultStyle;

  if (type === 'chart-pie') {
    defaultData = [
      { label: 'Part 1', value: 30, color: '#3b82f6' },
      { label: 'Part 2', value: 70, color: '#e2e8f0' }
    ];
    defaultStyle = { width: 200, height: 200 };
  } else if (type === 'smart-table') {
    defaultData = {
      headers: ['Nom', 'Valeur'],
      rows: [['Item A', '100'], ['Item B', '200']]
    };
    defaultStyle = { width: 300, height: 150 }; // Ajout de height pour le resize
  } else if (type === 'progress-bar') {
    defaultData = { value: 65 };
    defaultStyle = { width: 250, height: 50, color: '#2563eb' };
  } else if (type === 'org-chart') {
  defaultData = {
    id: Date.now().toString(), // ID requis pour la comparaison selectedId
    label: 'Directeur',
    children: [
      { id: (Date.now() + 1).toString(), label: 'Adjoint A', children: [] }
    ]
  };
  defaultStyle = { 
    width: 500, 
    height: 300, 
    borderColor: '#2563eb', 
    bgColor: '#eff6ff' 
  };
}

  currentSlide.value.elements.push({
    id: Date.now(),
    type: type,
    x: 150, 
    y: 150,
    animation: { type: 'none', duration: 500, delay: 0 },
    data: defaultData,
    style: defaultStyle
  });

  showSmartMenu.value = false;
  savePresentation();
};

const addTableRow = () => {
  const colCount = selectedElement.value.data.rows[0].length;
  selectedElement.value.data.rows.push(new Array(colCount).fill('Texte'));
  savePresentation();
};

const addTableCol = () => {
  selectedElement.value.data.headers.push('Nouv.');
  selectedElement.value.data.rows.forEach(row => row.push(''));
  savePresentation();
};

const removeTableRow = (index) => {
  if (selectedElement.value.data.rows.length > 1) {
    selectedElement.value.data.rows.splice(index, 1);
    savePresentation();
  }
};

const handleTableUpdate = ({ type, rowIdx, colIdx, value }) => {
  if (!selectedElement.value) return;

  if (type === 'header') {
    selectedElement.value.data.headers[rowIdx] = value;
  } else if (type === 'row') {
    selectedElement.value.data.rows[rowIdx][colIdx] = value;
  }
  
  savePresentation();
};

const addOrgChild = () => {
  const el = selectedElement.value;
  if (!el.selectedNodeId) el.selectedNodeId = el.data.id; // Par défaut sur la racine

  const findAndAdd = (node) => {
    if (node.id === el.selectedNodeId) {
      if (!node.children) node.children = [];
      node.children.push({ id: Date.now(), label: 'Nouveau', children: [] });
      return true;
    }
    if (node.children) {
      for (let child of node.children) {
        if (findAndAdd(child)) return true;
      }
    }
    return false;
  };
  
  findAndAdd(el.data);
  savePresentation();
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

const initResize = (handle, event) => {
  isResizing.value = true;
  resizeHandle.value = handle;
  
  // On stocke les valeurs initiales
  initialSize.width = selectedElement.value.style.width || 200;
  initialSize.height = selectedElement.value.style.height || 150;
  initialSize.x = selectedElement.value.x;
  initialSize.y = selectedElement.value.y;
  
  initialMouse.x = event.clientX;
  initialMouse.y = event.clientY;

  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);
};

const handleResize = (event) => {
  if (!isResizing.value || !selectedElement.value) return;

  const dx = event.clientX - initialMouse.x;
  const dy = event.clientY - initialMouse.y;
  const el = selectedElement.value;

  if (resizeHandle.value === 'bottom-right') {
    el.style.width = Math.max(50, initialSize.width + dx);
    el.style.height = Math.max(30, initialSize.height + dy);
  } 
  else if (resizeHandle.value === 'bottom-left') {
    const newWidth = Math.max(50, initialSize.width - dx);
    if (newWidth > 50) {
      el.style.width = newWidth;
      el.x = initialSize.x + dx;
    }
    el.style.height = Math.max(30, initialSize.height + dy);
  }
  else if (resizeHandle.value === 'top-right') {
    el.style.width = Math.max(50, initialSize.width + dx);
    const newHeight = Math.max(30, initialSize.height - dy);
    if (newHeight > 30) {
      el.style.height = newHeight;
      el.y = initialSize.y + dy;
    }
  }
  else if (resizeHandle.value === 'top-left') {
    const newWidth = Math.max(50, initialSize.width - dx);
    const newHeight = Math.max(30, initialSize.height - dy);
    if (newWidth > 50) {
      el.style.width = newWidth;
      el.x = initialSize.x + dx;
    }
    if (newHeight > 30) {
      el.style.height = newHeight;
      el.y = initialSize.y + dy;
    }
  }
};

const stopResize = () => {
  isResizing.value = false;
  window.removeEventListener('mousemove', handleResize);
  window.removeEventListener('mouseup', stopResize);
  savePresentation();
};
const fetchData = async () => {
  const { id } = route.params;

  const { data: pres } = await supabase.from('presentations').select('*').eq('id', id).single();
  presentation.value = pres;

  const { data: sld } = await supabase.from('slides').select('*').eq('presentation_id', id).order('order_index');
  
  // ✅ Normalise tous les éléments existants qui n'ont pas encore animation
  slides.value = sld.map(slide => ({
    ...slide,
    elements: (slide.elements || []).map(el => ({
      ...el,
      animation: el.animation || { type: 'none', duration: 500, delay: 0 }
    }))
  }));

  loading.value = false;
};

const getElementStyle = (el) => {
  const baseStyle = {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
    // On applique systématiquement width et height s'ils existent dans le style de l'objet
    width: el.style?.width ? el.style.width + 'px' : 'auto',
    height: el.style?.height ? el.style.height + 'px' : 'auto',
  };

  if (el.type === 'text') {
    const themeFont = presentation.value?.theme_config?.font || 'Arial, sans-serif';
    const themeColor = presentation.value?.theme_config?.colors?.text || '#000000';

    return {
      ...baseStyle,
      fontSize: (el.style.fontSize || 24) + 'px',
      fontWeight: el.style.fontWeight || 'normal',
      fontStyle: el.style.fontStyle || 'normal',
      textDecoration: el.style.textDecoration || 'none',
      textAlign: el.style.textAlign || 'left',
      fontFamily: el.style.fontFamily || themeFont,
      color: el.style.color || themeColor,
      minWidth: '150px', 
      display: 'block'
    };
  }

  // Pour les images et Smart Objects, baseStyle contient déjà width/height
  return baseStyle;
};

const getMiniatureStyle = (el) => {
  const ratio = 3.5; 
  const baseStyle = {
    position: 'absolute',
    left: (el.x / ratio) + 'px', 
    top: (el.y / ratio) + 'px',
    pointerEvents: 'none',
    zIndex: 1
  };

  if (el.type === 'text') {
    return { 
      ...baseStyle, 
      fontSize: Math.max((el.style.fontSize / ratio), 4) + 'px',
      width: 'max-content'
    };
  }

  // Pour Smart Objects et Images : il FAUT une taille définie
  return {
    ...baseStyle,
    width: ((el.style.width || 200) / ratio) + 'px',
    height: el.style.height ? (el.style.height / ratio) + 'px' : 'auto'
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
    x: 100, y: 100,
    animation: { type: 'none', duration: 500, delay: 0 }, // ← AJOUTE
    style: { fontSize: 24, color: '#000000', fontWeight: 'normal', fontFamily: presentation.value?.theme_config?.font || 'Arial' }
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
      animation: { type: 'none', duration: 500, delay: 0 },
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
// ========= EXPORT PDF =========
const exportPDF = async () => {
  isExporting.value = true;
  exportLabel.value = 'Export PDF...';

  try{
    // 1. On garde l'index actuel pour y revenir
    const savedIndex = currentSlideIndex.value;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

    for (let i = 0; i < slides.value.length; i++) {
      // Affiche temporairement chaque slide pour la capturer
      currentSlideIndex.value = i;
      selectedElement.value = null;
      await nextTick();

      const slideEl = document.getElementById('active-slide');
      if (!slideEl) continue;

      const canvas = await html2canvas(slideEl, {
        scale: 2,             // Résolution x2 pour la qualité
        useCORS: true,        // Autorise les images cross-origin
        backgroundColor: null,
        width: 700,
        height: 400,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) pdf.addPage([1280, 720], 'landscape');
      pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
    }

    // Restaure la slide courante
    currentSlideIndex.value = savedIndex;
    await nextTick();

    pdf.save(`${presentation.value?.title || 'presentation'}.pdf`);
  } finally {
    isExporting.value = false;
    exportLabel.value = '';
  }
  
};

// ========= EXPORT PPTX =========
const exportPPTX = async () => {
  isExporting.value = true;
  exportLabel.value = 'Export PPTX...';

  try{
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9'; // 10" x 5.625" = ratio 16/9

    // Dimensions du canvas éditeur (700x400px)
    const CANVAS_W = 700;
    const CANVAS_H = 400;
    // Dimensions PPTX en inches (10 x 5.625)
    const PPTX_W = 10;
    const PPTX_H = 5.625;

    const toInchX = (px) => (px / CANVAS_W) * PPTX_W;
    const toInchY = (px) => (px / CANVAS_H) * PPTX_H;
    const toInchW = (px) => (px / CANVAS_W) * PPTX_W;
    const toInchH = (px) => (px / CANVAS_H) * PPTX_H;

    for (const slide of slides.value) {
      const pSlide = pptx.addSlide();

      // Fond de slide
      const theme = presentation.value?.theme_config;
      const bg = slide.background_config?.value || theme?.bg || '#ffffff';
      pSlide.background = { fill: bg.replace('#', '') };

      for (const el of (slide.elements || [])) {
        const x = toInchX(el.x);
        const y = toInchY(el.y);
        const w = toInchW(el.style?.width || 200);
        const h = toInchH(el.style?.height || 100);

        if (el.type === 'text') {
          const themeColor = theme?.colors?.text || '#000000';
          const color = (el.style?.color || themeColor).replace('#', '');
          const fontSize = Math.round((el.style?.fontSize || 24) * (PPTX_W / CANVAS_W) * 10);

          pSlide.addText(el.content || '', {
            x, y,
            w: toInchW(el.style?.width || 300),
            h: toInchH((el.style?.fontSize || 24) * 1.5 + 20),
            fontSize: Math.max(8, Math.round((el.style?.fontSize || 24) / 3.5)),
            bold: el.style?.fontWeight === 'bold',
            italic: el.style?.fontStyle === 'italic',
            underline: el.style?.textDecoration === 'underline' ? { style: 'sng' } : false,
            color,
            align: el.style?.textAlign || 'left',
            fontFace: (el.style?.fontFamily || 'Arial').split(',')[0].trim(),
            wrap: true,
          });

        } else if (el.type === 'image') {
          try {
            // Charge l'image en base64 via un canvas temporaire
            const imgB64 = await urlToBase64(el.content);
            pSlide.addImage({ data: imgB64, x, y, w, h });
          } catch {
            // Si l'image échoue (CORS), on ajoute un placeholder
            pSlide.addShape(pptx.ShapeType.rect, {
              x, y, w, h,
              fill: { color: 'E2E8F0' },
              line: { color: 'CBD5E1', width: 1 }
            });
          }

        } else {
          // SmartObjects (tableau, graphique, etc.) → capture en image via html2canvas
          try {
            const savedIndex = currentSlideIndex.value;
            currentSlideIndex.value = slides.value.indexOf(slide);
            selectedElement.value = null;
            await nextTick();

            // Trouve l'élément DOM correspondant
            const allEls = document.querySelectorAll('.editable-element');
            const elIdx = slide.elements.indexOf(el);
            const domEl = allEls[elIdx];

            if (domEl) {
              const canvas = await html2canvas(domEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: 'white',
                logging: false,
              });
              const imgData = canvas.toDataURL('image/png');
              pSlide.addImage({ data: imgData, x, y, w, h });
            }

            currentSlideIndex.value = savedIndex;
            await nextTick();
          } catch (err) {
            console.warn('SmartObject export failed:', err);
          }
        }
      }
    }

    await pptx.writeFile({ fileName: `${presentation.value?.title || 'presentation'}.pptx` });
  }finally {
    isExporting.value = false;
    exportLabel.value = '';
  }  
};

// Utilitaire : convertit une URL image en base64
const urlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// --- LOGIQUE DE SELECTION & DRAG ---

const selectElement = (el, event) => {
  if (isEditingText.value && selectedElement.value?.id === el.id) return;

  // ✅ Garantit que animation existe toujours sur l'élément
  if (!el.animation) {
    el.animation = { type: 'none', duration: 500, delay: 0 };
  }

  selectedElement.value = el;
  draggingElement.value = el;

  const canvas = document.getElementById('active-slide');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  offset.x = event.clientX - rect.left - el.x;
  offset.y = event.clientY - rect.top - el.y;

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// CORRECTION de la fonction handleMouseMove
const handleMouseMove = (event) => {
  if (!draggingElement.value || isEditingText.value) return;

  const canvas = document.getElementById('active-slide');
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();

  // Calcul des nouvelles coordonnées
  let newX = event.clientX - rect.left - offset.x;
  let newY = event.clientY - rect.top - offset.y;

  // Limites du canvas
  const canvasWidth = 700;
  const canvasHeight = 400;
  
  // Contrainte dans les limites du canvas
  newX = Math.max(0, Math.min(newX, canvasWidth - 50));
  newY = Math.max(0, Math.min(newY, canvasHeight - 20));
  
  // Reset des guides
  activeGuides.value = { x: null, y: null };

  // --- Aimantation Horizontale (Axe X - Centre) ---
  const centerX = canvasWidth / 2;
  if (Math.abs(newX - centerX) < snapThreshold) {
    newX = centerX;
    activeGuides.value.x = centerX;
  }

  // --- Aimantation Verticale (Axe Y - Centre) ---
  const centerY = canvasHeight / 2;
  if (Math.abs(newY - centerY) < snapThreshold) {
    newY = centerY;
    activeGuides.value.y = centerY;
  }

  // Application des positions
  draggingElement.value.x = newX;
  draggingElement.value.y = newY;
};

// CORRECTION de la fonction handleMouseUp
const handleMouseUp = () => {
  if (draggingElement.value) {
    // Sauvegarder la position finale
    savePresentation();
  }
  
  draggingElement.value = null;
  activeGuides.value = { x: null, y: null };
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

// CORRECTION de la fonction deselectAll
const deselectAll = (event) => {
  // Si le clic vient d'un élément éditable ou de ses enfants → ne pas désélectionner
  if (event.target.closest('.editable-element')) return;
  if (event.target.closest('.properties-panel')) return;
  if (event.target.closest('.insert-menu-wrapper')) return;

  selectedElement.value = null;
  isEditingText.value = false;
  showSmartMenu.value = false;
};

// CORRECTION de la fonction enableEditing
const enableEditing = (el) => {
  if (el.type !== 'text') return;
  
  // Arrêter le drag en cours
  draggingElement.value = null;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  
  selectedElement.value = el;
  isEditingText.value = true;
  
  // Petit délai pour laisser Vue mettre à jour le DOM
  nextTick(() => {
    const elDom = document.querySelector('.is-editing .text-content');
    if (elDom) {
      elDom.focus();
      // Placer le curseur à la fin du texte
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(elDom);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
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

// CORRECTION 3 : Plein écran uniquement sur le conteneur de présentation
const startPresentation = async () => {
  presentationIndex.value = currentSlideIndex.value;
  presentationMode.value = true;
  
  // Attendre que le DOM soit mis à jour
  await nextTick();
  
  // Demander le plein écran sur le conteneur de présentation, pas sur tout le document
  if (presentationContainer.value) {
    try {
      await presentationContainer.value.requestFullscreen();
    } catch (err) {
      // Fallback sur documentElement
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  }
  
  // Écoute les touches clavier
  window.addEventListener('keydown', handlePresentationKey);
};

const stopPresentation = async () => {
  presentationMode.value = false;
  window.removeEventListener('keydown', handlePresentationKey);
  
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  }
};

const nextSlide = () => {
  if (presentationIndex.value < slides.value.length - 1) {
    slideTransitionName.value = 'slide-next';
    presentationIndex.value++;
  }
};

const prevSlide = () => {
  if (presentationIndex.value > 0) {
    slideTransitionName.value = 'slide-prev';
    presentationIndex.value--;
  }
};

const handlePresentationKey = (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    prevSlide();
  }
  if (e.key === 'Escape') {
    stopPresentation();
  }
};

// CORRECTION 4 : Ajout du watch pour gérer le scale automatique du slide
const updateSlideScale = () => {
  if (presentationMode.value && presentationContainer.value) {
    const container = presentationContainer.value;
    const slideWidth = 1280;
    const slideHeight = 720;
    const scaleX = container.clientWidth / slideWidth;
    const scaleY = container.clientHeight / slideHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Ne pas dépasser 1 (taille native)
    
    const slideElement = document.querySelector('.presentation-slide');
    if (slideElement) {
      slideElement.style.setProperty('--slide-scale', scale);
    }
  }
};

// Watch pour ajuster le scale quand la présentation s'affiche
watch(presentationMode, async (newVal) => {
  if (newVal) {
    await nextTick();
    updateSlideScale();
    window.addEventListener('resize', updateSlideScale);
  } else {
    window.removeEventListener('resize', updateSlideScale);
  }
});

onMounted(fetchData);

// Nettoyage des events au démontage
onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handlePresentationKey);
    window.removeEventListener('resize', updateSlideScale);
});
</script>

<style scoped>
.editor-container {
  height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-container.preview-active .canvas-area {
  pointer-events: none;
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

.main-slide {
  z-index: 1;
}

/* État normal du panneau */
.properties-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 280px;
  height: calc(100% - 100px);
  z-index: 100;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* CHANGEMENT ICI */
  overflow: visible; /* On garde visible pour le bouton */
  display: flex;     /* Pour que le wrapper interne occupe tout l'espace */
  flex-direction: column;
}

.panel-content-wrapper {
  width: 100%;       /* Utilise 100% de la largeur du parent animé */
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-sizing: border-box;
  
  /* CHANGEMENT ICI */
  overflow-y: auto;
  overflow-x: hidden; /* Empêche tout débordement horizontal interne */
  border-radius: 12px; /* Pour que le scroll respecte l'arrondi du parent */
}

/* État réduit */
.properties-panel.collapsed {
  width: 45px;
  background: rgba(255, 255, 255, 0.9);
  /* On ne met pas overflow: hidden ici sinon le bouton disparaît */
}

/* Cache le contenu quand c'est réduit pour éviter que des morceaux dépassent */
.properties-panel.collapsed .panel-content-wrapper {
  opacity: 0;
  pointer-events: none;
}
.editable-element {
  position: absolute;
  cursor: move;
  user-select: none;
  min-width: 20px;
  min-height: 20px;
  z-index: 10;
}

.editable-element:hover {
  outline: 1px dashed #2563eb;
}

.editable-element.is-selected {
  z-index: 20;
  /* PAS d'outline ici — ça interfère avec les clics sur les bords */
}

.editable-element.is-editing {
  cursor: text;
  z-index: 30;
}

.editable-element:not(.is-editing) .text-content {
  pointer-events: none;
}

.editable-element.is-editing .text-content {
  pointer-events: auto;
  user-select: text;
}

.selection-box {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #2563eb;
  pointer-events: none; /* La box est transparente... */
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #2563eb;
  border-radius: 50%;
  pointer-events: auto; /* ...mais les poignées captent les clics ! */
  z-index: 100;
}

/* Positionnement des poignées */
.top-left { top: -6px; left: -6px; cursor: nwse-resize; }
.top-right { top: -6px; right: -6px; cursor: nesw-resize; }
.bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
.bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }

.text-content {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-content[contenteditable="true"] {
  cursor: text;
}

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
.pi.pi-bold {
  font-weight: bold;
}

.pi.pi-italic {
  font-style: italic;
}
.pi.pi-underline {
  text-decoration: underline;
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

.insert-menu-wrapper { position: relative; }
.insert-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 180px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  padding: 8px;
  margin-top: 10px;
  z-index: 1000;
  border: 1px solid #e2e8f0;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #1e293b;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.dropdown-item:hover { background: #f1f5f9; color: #2563eb; }
.dropdown-item i { color: #64748b; }
.btn-tool.accent { background: #2563eb; color: white; border: none; }

/* Pour que le SmartRenderer s'adapte à la div parente scalée dans la miniature */
.miniature-smart-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* On s'assure que les tableaux dans les miniatures ne débordent pas */
.miniature-smart-wrapper :deep(.smart-table) {
  font-size: 2px !important; /* Très petit texte pour la miniature */
}

.miniature-smart-wrapper :deep(.smart-renderer) {
  /* On annule les largeurs fixes pour laisser le ratio miniature opérer */
  width: 100% !important; 
  height: 100% !important;
}

/* Empêcher les éléments Smart de déborder de la petite miniature */
.mini-smart-obj {
  width: 100%;
  height: 100%;
  transform-origin: top left;
  overflow: hidden;
}

/* Force les tableaux à être minuscules dans les miniatures */
.mini-smart-obj :deep(table) {
  font-size: 2px !important;
  border-width: 0.1px !important;
}

/* Assurer que le container du renderer ne bloque pas la sélection */
.smart-renderer {
  user-select: none;
}
/* Permet de cliquer précisément dans les cellules même si elles sont petites */
.smart-table td, .smart-table th {
  min-width: 40px;
  min-height: 20px;
  cursor: text; /* Indique visuellement que c'est éditable */
  outline-color: #2563eb; /* Couleur de focus bleue */
}

/* Empêche le drag de l'élément parent quand on sélectionne du texte dans le tableau */
.smart-table td:focus, .smart-table th:focus {
  background-color: rgba(37, 99, 235, 0.05);
}
.btn-secondary, .btn-danger, .header-info, .group-header {
  display: flex;
  align-items: center;
  gap: 8px; /* Espace constant entre l'icône et le texte */
}

.btn-secondary i, .btn-danger i {
  font-size: 0.9rem;
}

.action-grid {
  display: flex;
  gap: 8px;
}

.text-tools-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.full-width { width: 100%; }

.button-group-row {
  display: flex;
  gap: 5px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.btn-icon-tool {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.btn-icon-tool:hover { background: #e2e8f0; }

.btn-icon-tool.is-active {
  background: white;
  color: #2563eb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.input-modern {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

/* === PANNEAU DE PROPRIÉTÉS === */
.properties-panel {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 268px;
  height: calc(100% - 32px);
  z-index: 100;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.properties-panel.collapsed {
  width: 44px;
  overflow: hidden;
}

.properties-panel.collapsed .panel-content-wrapper {
  opacity: 0;
  pointer-events: none;
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-info i {
  color: #38bdf8;
  font-size: 0.9rem;
}

.panel-header h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.btn-close-panel {
  background: #1e293b;
  border: 1px solid #334155;
  color: #64748b;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
}

.btn-close-panel:hover {
  background: #334155;
  color: #f1f5f9;
}

/* Wrapper scrollable */
.panel-content-wrapper {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;

  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

.panel-content-wrapper::-webkit-scrollbar { width: 4px; }
.panel-content-wrapper::-webkit-scrollbar-track { background: transparent; }
.panel-content-wrapper::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

/* Badge type d'élément */
.element-badge {
  display: inline-flex;
  align-items: center;
  background: #1e293b;
  border: 1px solid #334155;
  color: #38bdf8;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
  width: fit-content;
}

/* Groupes de propriétés */
.prop-group {
  background: #1e293b;
  border: 1px solid #253347;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2d3f55;
}

.group-header i {
  color: #38bdf8;
  font-size: 0.8rem;
}

.group-header label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0;
}

/* Grilles de style */
.style-grid-modern {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.style-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.style-field span {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.style-field input[type="number"],
.input-modern,
.input-with-unit input {
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.82rem;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.style-field input[type="number"]:focus,
.input-modern:focus {
  border-color: #38bdf8;
}

.input-with-unit {
  display: flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.input-with-unit:focus-within { border-color: #38bdf8; }

.input-with-unit input {
  border: none;
  background: transparent;
  padding: 6px 8px;
  flex: 1;
}

.unit {
  font-size: 0.7rem;
  color: #475569;
  padding: 0 8px;
  background: #1e293b;
  border-left: 1px solid #334155;
  height: 100%;
  display: flex;
  align-items: center;
}

/* Color picker */
.color-picker-modern {
  width: 100%;
  height: 32px;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: #0f172a;
}

/* Select */
.select-modern {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.select-modern:focus { border-color: #38bdf8; }

/* Boutons outils texte (gras, italique…) */
.text-tools-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button-group-row {
  display: flex;
  gap: 4px;
  background: #0f172a;
  padding: 3px;
  border-radius: 7px;
  border: 1px solid #334155;
}

.btn-icon-tool {
  flex: 1;
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  color: #64748b;
  font-size: 0.85rem;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-tool:hover { background: #1e293b; color: #e2e8f0; }

.btn-icon-tool.is-active {
  background: #38bdf8;
  color: #0f172a;
}

/* Boutons actions secondaires */
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  justify-content: center;
}

.btn-secondary:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.06);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Bouton danger */
.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  padding: 8px;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.btn-danger-light {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  justify-content: center;
}

.btn-danger-light:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

/* Hint */
.hint {
  font-size: 0.72rem;
  color: #475569;
  margin: 0;
  font-style: italic;
  line-height: 1.5;
}
/* ========= BOUTON LECTURE ========= */
.btn-present {
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}
.btn-present:hover { opacity: 0.9; }

/* ========= OVERLAY PRÉSENTATION ========= */
.presentation-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.presentation-slide-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.presentation-slide {
  width: 1280px;
  height: 720px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transform-origin: center center;
  /* Le scale est défini dynamiquement via la variable CSS */
  transform: scale(var(--slide-scale, 0.5));
}

/* Animation des éléments - CORRIGÉ */
.anim-fade {
  animation: anim-fade var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease;
}

.anim-slide-up {
  animation: anim-slide-up var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease;
}

.anim-slide-left {
  animation: anim-slide-left var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease;
}

.anim-zoom {
  animation: anim-zoom var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease;
}

.anim-bounce {
  animation: anim-bounce var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease;
}

/* ========= TRANSITIONS SLIDES ========= */
/* slide-next : nouvelle slide entre par la droite */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active { transition: transform 0.5s ease, opacity 0.5s ease; }

.slide-next-enter-from { transform: translateX(100%); opacity: 0; }
.slide-next-leave-to   { transform: translateX(-100%); opacity: 0; }
.slide-prev-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-prev-leave-to   { transform: translateX(100%); opacity: 0; }

/* ========= ANIMATIONS ÉLÉMENTS ========= */
@keyframes anim-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes anim-slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes anim-slide-left {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes anim-zoom {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes anim-bounce {
  0%   { opacity: 0; transform: scale(0.3); }
  60%  { transform: scale(1.1); }
  80%  { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

.presentation-overlay .pres-element { position: absolute; }

.presentation-overlay .anim-fade      { animation: anim-fade      var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease; }
.presentation-overlay .anim-slide-up  { animation: anim-slide-up  var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease; }
.presentation-overlay .anim-slide-left{ animation: anim-slide-left var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease; }
.presentation-overlay .anim-zoom      { animation: anim-zoom      var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease; }
.presentation-overlay .anim-bounce    { animation: anim-bounce    var(--anim-duration, 500ms) var(--anim-delay, 0ms) both ease; }
.presentation-overlay .anim-none      { animation: none; }

/* ========= BARRE DE CONTRÔLE ========= */
.presentation-controls {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid #334155;
  padding: 8px 16px;
  border-radius: 40px;
  z-index: 10000;
  cursor: default;
  opacity: 0;
  transition: opacity 0.3s;
}

/* Apparaît au survol du bas de l'écran */
.presentation-overlay:hover .presentation-controls { opacity: 1; }

.pres-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.pres-btn:hover:not(:disabled) { background: #334155; color: white; }
.pres-btn:disabled { opacity: 0.3; cursor: default; }
.pres-btn.danger { border-color: rgba(239,68,68,0.4); color: #f87171; }
.pres-btn.danger:hover { background: rgba(239,68,68,0.15); }

.pres-counter {
  font-size: 0.8rem;
  color: #94a3b8;
  min-width: 60px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.smart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* S'assurer que les handles de redimensionnement sont toujours cliquables */
.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #2563eb;
  border-radius: 50%;
  pointer-events: auto;
  z-index: 100;
}

.handle:hover {
  background: #2563eb;
  transform: scale(1.2);
}
</style>