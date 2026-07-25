<template>
  <div
    class="upload-zone"
    :class="{ dragging, uploading }"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="!uploading">
      <div class="upload-icon">📄</div>
      <p class="upload-text">
        拖拽文件到此处，或
        <label class="upload-link"
          >点击选择<input type="file" accept=".md,.txt,.pdf,.docx" @change="handleSelect" hidden
        /></label>
      </p>
      <p class="upload-hint">支持 .md / .txt / .pdf / .docx，最大 20MB</p>
    </template>
    <template v-else>
      <div class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="progress-text">上传中... {{ progress }}%</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ uploading: Boolean, progress: { type: Number, default: 0 } })
const emit = defineEmits(['upload'])

const dragging = ref(false)

const handleDrop = (e) => {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) emit('upload', file)
}

const handleSelect = (e) => {
  const file = e.target.files[0]
  if (file) emit('upload', file)
}
</script>

<style lang="less" scoped>
.upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  margin-bottom: 24px;
  transition: all 0.2s;
  background: #fff;
}
.upload-zone.dragging {
  border-color: #2563eb;
  background: #eff6ff;
}
.upload-zone.uploading {
  border-style: solid;
  border-color: #2563eb;
}
.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.upload-text {
  font-size: 14px;
  color: #475569;
}
.upload-link {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}
.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s;
}
.progress-text {
  font-size: 13px;
  color: #2563eb;
  margin-top: 8px;
}
</style>
