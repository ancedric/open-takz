<template>
  <div class="smart-renderer" :style="containerStyle">
    
    <svg v-if="element.type === 'chart-pie'" viewBox="0 0 200 200" class="smart-svg">
      <path 
        v-for="(slice, idx) in element.data" 
        :key="idx"
        :d="getPiePath(idx, element.data, 100)"
        :fill="slice.color"
      />
    </svg>

    <svg v-else-if="element.type === 'chart-bar'" viewBox="0 0 200 150" class="smart-svg">
      <g v-for="(item, idx) in element.data" :key="idx">
        <rect 
          :x="idx * (200 / element.data.length) + 5" 
          :y="150 - (item.value * 1.2)" 
          :width="(200 / element.data.length) - 10" 
          :height="item.value * 1.2" 
          :fill="item.color || element.style.color || '#3b82f6'" 
        />
      </g>
    </svg>
    
    <table v-else-if="element.type === 'smart-table'" 
        class="smart-table"
        :style="{ 
            border: `${element.style.borderWidth || 1}px solid ${element.style.borderColor || '#cbd5e1'}`,
            backgroundColor: element.style.bgColor || 'white',
            color: element.style.color || '#1e293b'
        }">
            <thead>
                <tr :style="{ backgroundColor: element.style.headerBg || '#f8fafc' }">
                <th v-for="(h, idx) in element.data.headers" 
                    :key="idx"
                    contenteditable="true"
                    :style="{ color: element.style.headerColor || '#1e293b' }"
                    @blur="e => updateCell('header', idx, null, e.target.innerText)">{{ h }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, i) in element.data.rows" :key="i">
                <td v-for="(cell, j) in row" 
                    :key="j"
                    contenteditable="true"
                    @blur="e => updateCell('row', i, j, e.target.innerText)">{{ cell }}</td>
                </tr>
            </tbody>
        </table>

    <div v-else-if="element.type === 'progress-bar'" class="progress-container">
       <div class="progress-fill" :style="{ width: element.data.value + '%', backgroundColor: element.style.color || '#2563eb' }"></div>
    </div>
    <div v-else-if="element.type === 'org-chart'" class="org-chart-wrapper">
      <OrgNode
        :node="element.data"
        :style-config="element.style"
        :selected-id="element.selectedNodeId"
        @update="emit('update-data', element.data)"
        @node-click="n => { element.selectedNodeId = n.id; emit('update-data', element.data); }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import OrgNode from './OrgNode.vue';

const emit = defineEmits(['update-data']);
const props = defineProps({
  element: { type: Object, required: true }
});

const containerStyle = computed(() => ({
  width: props.element.style?.width ? `${props.element.style.width}px` : '100%',
  height: props.element.style?.height ? `${props.element.style.height}px` : '100%',
}));

const updateCell = (type, rowIdx, colIdx, value) => {
  emit('update-data', { type, rowIdx, colIdx, value });
};

const getPiePath = (index, data, radius) => {
  let total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  for (let i = 0; i < index; i++) {
    startAngle += (data[i].value / total) * 2 * Math.PI;
  }
  const endAngle = startAngle + (data[index].value / total) * 2 * Math.PI;
  const x1 = radius + radius * Math.sin(startAngle);
  const y1 = radius - radius * Math.cos(startAngle);
  const x2 = radius + radius * Math.sin(endAngle);
  const y2 = radius - radius * Math.cos(endAngle);
  const largeArcFlag = (data[index].value / total) > 0.5 ? 1 : 0;
  return `M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
};
</script>

<style scoped>
.smart-renderer { position: relative; overflow: hidden; }
.smart-svg { width: 100%; height: 100%; }

.smart-table { 
  width: 100%; border-collapse: collapse; font-size: 0.9rem;
}
.smart-table td, .smart-table th {
  padding: 10px;
  min-width: 50px;
  /* Assure que le texte ne disparaît pas si la cellule est "vide" */
  min-height: 1.2em; 
  outline: none; /* Retire la bordure orange/bleue par défaut du navigateur */
  transition: background 0.2s;
}

/* Style quand on édite la cellule */
.smart-table td:focus, .smart-table th:focus {
  background-color: white !important;
  color: #000000 !important; /* Force le texte en noir pendant l'édition pour être sûr */
  box-shadow: inset 0 0 0 2px #2563eb; /* Ajoute une bordure interne bleue propre */
}

/* Si le tableau est dans une miniature, on cache le curseur */
.miniature-smart-wrapper .smart-table td {
  pointer-events: none;
}

.progress-container {
  width: 100%; height: 24px; background: #e2e8f0; border-radius: 12px; position: relative;
}
.progress-fill { height: 100%; border-radius: 12px; transition: width 0.3s ease; }
.progress-label { position: absolute; right: 10px; top: 2px; font-size: 0.75rem; font-weight: bold; }

.table-grid-editor {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  padding: 5px;
  background: white;
}

.table-edit-row {
  display: flex;
  gap: 2px;
}

.cell-input {
  flex: 1;
  min-width: 50px;
  border: 1px solid #f1f5f9;
  font-size: 0.75rem;
  padding: 4px;
}

.cell-input:focus {
  background: #eff6ff;
  border-color: #3b82f6;
  outline: none;
}

.table-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.table-actions button {
  flex: 1;
  font-size: 0.7rem;
  padding: 5px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
}

.org-chart-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

.org-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.org-node-box {
  padding: 10px;
  border: 2px solid;
  border-radius: 6px;
  min-width: 120px;
  text-align: center;
  cursor: pointer;
  background: white;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.is-active-node {
  box-shadow: 0 0 0 3px #2563eb44;
  transform: scale(1.05);
}

.org-children-row {
  display: flex;
  position: relative;
  padding-top: 20px;
  gap: 20px;
}

/* Ligne verticale sous le parent */
.org-children-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 20px;
  background: #cbd5e1;
}

/* Ligne horizontale de liaison */
.org-branch::after {
  content: '';
  position: absolute;
  top: 0;
  width: 100%;
  height: 2px;
  background: #cbd5e1;
}

/* On cache la ligne horizontale pour les extrémités */
.org-branch:first-child:last-child::after { display: none; }
.org-branch:first-child::after { left: 50%; width: 50%; }
.org-branch:last-child::after { right: 50%; width: 50%; }

/* Petite ligne verticale au-dessus de chaque enfant */
.org-node-box::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  width: 2px;
  height: 20px;
  background: #cbd5e1;
}
.org-chart-wrapper > .org-branch > .org-node-box::before { display: none; }
</style>