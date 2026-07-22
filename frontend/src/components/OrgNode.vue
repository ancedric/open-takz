<template>
  <div class="org-branch">
    <div class="org-node-wrapper">
      <div
        class="org-node-box"
        :class="{ 'is-active-node': selectedId === node.id }"
        :style="{
          backgroundColor: node.bgColor || styleConfig?.bgColor || '#eff6ff',
          borderColor: styleConfig?.borderColor || '#2563eb',
          color: '#1e293b'
        }"
        @click.stop="$emit('node-click', node)"
      >
        <span
          contenteditable="true"
          @blur="e => { node.label = e.target.innerText; $emit('update') }"
          @mousedown.stop
        >{{ node.label }}</span>
      </div>

      <!-- Palette flottante, visible au hover via CSS -->
      <div class="node-color-picker" @mousedown.stop @click.stop>
        <label title="Couleur de fond">
          <i class="pi pi-palette"></i>
          <input
            type="color"
            :value="node.bgColor || styleConfig?.bgColor || '#eff6ff'"
            @input="e => { node.bgColor = e.target.value; $emit('update') }"
          />
        </label>
      </div>
    </div>

    <div v-if="node.children && node.children.length" class="org-children-wrapper">
      <div class="org-vertical-line"></div>
      <div class="org-children-row">
        <div v-for="child in node.children" :key="child.id" class="org-child-col">
          <div class="org-horizontal-tick"></div>
          <OrgNode
            :node="child"
            :style-config="styleConfig"
            :selected-id="selectedId"
            @update="$emit('update')"
            @node-click="n => $emit('node-click', n)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'OrgNode' });

defineProps({
  node: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: null }
});

defineEmits(['update', 'node-click']);
</script>

<style scoped>
.org-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.org-node-box {
  padding: 8px 16px;
  border: 2px solid #2563eb;
  border-radius: 8px;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b; /* ← Texte toujours sombre */
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.org-node-box span {
  display: block;
  color: #1e293b; /* Double sécurité pour contenteditable */
  outline: none;
}

.org-node-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.is-active-node {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
  transform: scale(1.05);
}

/* Wrapper pour positionner la palette par rapport au nœud */
.org-node-wrapper {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

/* Palette flottante au-dessus du nœud */
.node-color-picker {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 4px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  z-index: 50;

  /* Caché par défaut */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateX(-50%) translateY(4px);
}

/* Visible au hover du wrapper */
.org-node-wrapper:hover .node-color-picker {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

.node-color-picker label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.75rem;
}

.node-color-picker label:hover {
  color: #2563eb;
}

.node-color-picker input[type="color"] {
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

/* Lignes de connexion */
.org-vertical-line {
  width: 2px;
  height: 24px;
  background: #cbd5e1;
  margin: 0 auto;
}

.org-children-row {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.org-children-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: calc(50px + 1px);
  right: calc(50px + 1px);
  height: 2px;
  background: #cbd5e1;
}

.org-child-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 12px;
}

.org-horizontal-tick {
  width: 2px;
  height: 20px;
  background: #cbd5e1;
}
</style>