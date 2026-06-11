<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '新增服务' : '编辑服务'"
    width="760px"
    top="5vh"
    @close="emit('update:modelValue', false)"
  >
    <div class="service-form">
      <el-form ref="formRef" :model="draft" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col v-if="mode === 'create'" :xs="24" :md="12">
            <el-form-item label="目标主机" prop="host">
              <el-input v-model="draft.host" disabled />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="mode === 'create' ? 12 : 12">
            <el-form-item label="运行环境" prop="active">
              <el-input v-model="draft.active" placeholder="prod" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item label="业务名称" prop="jobName">
              <el-input v-model="draft.jobName" placeholder="demo-project" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="模块名称" prop="moduleName">
              <el-input v-model="draft.moduleName" placeholder="member" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="16">
            <el-form-item label="Java 路径" prop="javaPath">
              <el-input v-model="draft.javaPath" placeholder="/usr/local/jdk17/bin/java" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="draft.port" :min="1" :max="65535" class="service-form__port" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item label="Jar 名称" prop="jarName">
              <el-input v-model="draft.jarName" placeholder="member.jar" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="配置文件名" prop="configName">
              <el-input v-model="draft.configName" placeholder="留空时自动生成" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="Xms" prop="xms">
              <el-input v-model="draft.xms" placeholder="128m" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="Xmx" prop="xmx">
              <el-input v-model="draft.xmx" placeholder="128m" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="运行用户" prop="user">
              <el-input v-model="draft.user" placeholder="root" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <div class="service-form__actions">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? '创建服务' : '保存变更' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref, watch } from 'vue';

import type { ServiceCreatePayload, ServiceUpdatePayload } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  submitting: boolean;
  initialValue: ServiceCreatePayload | ServiceUpdatePayload;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submit: [payload: any];
}>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const draft = reactive<Record<string, any>>({ ...props.initialValue });
const formRef = ref<FormInstance>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rules: FormRules<Record<string, any>> = {
  jobName: [{ required: true, message: '请输入业务名称', trigger: 'blur' }],
  moduleName: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
  javaPath: [{ required: true, message: '请输入 Java 路径', trigger: 'blur' }],
  active: [{ required: true, message: '请输入运行环境', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'change' }],
  xms: [{ required: true, message: '请输入 Xms', trigger: 'blur' }],
  xmx: [{ required: true, message: '请输入 Xmx', trigger: 'blur' }],
  user: [{ required: true, message: '请输入运行用户', trigger: 'blur' }],
};

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(draft, value);
  },
  { deep: true, immediate: true },
);

async function handleSubmit() {
  const isValid = await formRef.value?.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  emit('submit', { ...draft });
}
</script>

<style scoped>
.service-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-form__port {
  width: 100%;
}

.service-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
