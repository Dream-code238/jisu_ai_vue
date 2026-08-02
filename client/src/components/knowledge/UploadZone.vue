<template>
  <div
    class="kb-upload"
    :class="{ dragging, uploading }"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="!uploading">
      <div class="kb-upload-icon">📄</div>
      <h3>
        拖拽文件到此处，或
        <label class="upload-link">
          点击选择
          <input type="file" accept=".md,.txt,.pdf,.docx" @change="handleSelect" hidden />
        </label>
      </h3>
      <p>支持 .md / .txt / .pdf / .docx，最大 20MB</p>
    </template>
    <template v-else>
      <div class="kb-upload-icon" style="background: var(--blue-l); color: var(--blue)">⏳</div>
      <h3>上传处理中... {{ progress }}%</h3>
      <div class="upload-progress-bar">
        <div class="upload-progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  uploading: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
})
const emit = defineEmits(['upload'])

const dragging = ref(false)

const handleDrop = (e) => {
  dragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) emit('upload', files[0])
}

const handleSelect = (e) => {
  const file = e.target.files[0]
  if (file) emit('upload', file)
  e.target.value = ''
}
</script>

<style scoped>
.kb-upload {
  background: #fff;
  border: 2px dashed var(--slate-200);
  border-radius: 14px;
  padding: 32px;
  text-align: center;
  transition: all 0.15s;
  cursor: pointer;
}
.kb-upload:hover,
.kb-upload.dragging {
  border-color: var(--teal-b);
  background: var(--teal-l);
}
.kb-upload.uploading {
  cursor: default;
  border-style: solid;
  border-color: var(--blue-b);
}
.kb-upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--teal-l);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin: 0 auto 12px;
}
.kb-upload h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--slate-700);
  margin-bottom: 4px;
}
.kb-upload p {
  font-size: 13px;
  color: var(--slate-400);
}
.upload-link {
  color: var(--teal);
  cursor: pointer;
  text-decoration: underline;
}
.upload-progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: var(--slate-100);
  border-radius: 4px;
  overflow: hidden;
  margin: 12px auto 0;
}
.upload-progress-fill {
  height: 100%;
  background: var(--blue);
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>
