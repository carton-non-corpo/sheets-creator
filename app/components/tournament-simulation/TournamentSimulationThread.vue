<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';

interface Step {
  key: string
  label: string
  completed: boolean
}

defineProps<{
  steps: Step[]
  currentStep: number
}>();

const emit = defineEmits<{
  goToStep: [step: number]
}>();
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-for="(step, index) in steps" :key="step.key">
        <BreadcrumbItem>
          <BreadcrumbLink
            v-if="index < currentStep"
            class="cursor-pointer hover:text-blue-600"
            @click="emit('goToStep', index)"
          >
            {{ step.label }}
          </BreadcrumbLink>
          <BreadcrumbPage v-else-if="index === currentStep" class="font-semibold text-blue-600">
            {{ step.label }}
          </BreadcrumbPage>
          <span v-else class="text-gray-400">
            {{ step.label }}
          </span>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index < steps.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
