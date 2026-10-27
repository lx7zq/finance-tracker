<!-- src/components/ui/EmptyLedger.vue -->
<template>
  <div class="text-center">
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- โต๊ะ/เงา -->
      <ellipse cx="60" cy="102" rx="38" ry="6" fill="#43303A" opacity="0.08" />

      <!-- ฝั่งซ้ายของสมุด -->
      <path
        d="M18 78 C18 78 28 70 58 70 L58 38 C28 38 18 46 18 46 Z"
        stroke="#43303A"
        stroke-width="2.5"
        stroke-linejoin="round"
        fill="#FFFFFF"
      />
      <!-- ฝั่งขวาของสมุด -->
      <path
        d="M102 78 C102 78 92 70 62 70 L62 38 C92 38 102 46 102 46 Z"
        stroke="#43303A"
        stroke-width="2.5"
        stroke-linejoin="round"
        fill="#FFFFFF"
      />
      <!-- สันกลางสมุด -->
      <path d="M60 39 L60 70" stroke="#43303A" stroke-width="2.5" stroke-linecap="round" />

      <!-- เส้นบัญชี ฝั่งซ้าย -->
      <path
        d="M28 54 C36 50 48 48 54 48"
        stroke="#43303A"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.35"
      />
      <path
        d="M28 62 C36 58 48 56 54 56"
        stroke="#43303A"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.35"
      />
      <!-- เส้นบัญชี ฝั่งขวา -->
      <path
        d="M66 48 C72 48 84 50 92 54"
        stroke="#43303A"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.35"
      />
      <path
        d="M66 56 C72 56 84 58 92 62"
        stroke="#43303A"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.35"
      />

      <!-- เหรียญลอย 1 (ใหญ่) -->
      <g>
        <circle cx="84" cy="26" r="11" stroke="#43303A" stroke-width="2.5" fill="#FFFFFF" />
        <circle cx="84" cy="26" r="6.5" stroke="#E5B84B" stroke-width="2" fill="none" />
        <path
          d="M84 22.5 L84 29.5 M81.5 24.5 C81.5 23.2 82.6 22.5 84 22.5 C85.4 22.5 86.5 23.2 86.5 24.5 C86.5 25.8 85.4 26.2 84 26.5 C82.6 26.8 81.5 27.2 81.5 28.5 C81.5 29.8 82.6 30.5 84 30.5 C85.4 30.5 86.5 29.8 86.5 28.5"
          stroke="#E5B84B"
          stroke-width="1.6"
          stroke-linecap="round"
          fill="none"
        />
      </g>

      <!-- เหรียญลอย 2 (เล็ก) -->
      <g>
        <circle cx="36" cy="30" r="7.5" stroke="#43303A" stroke-width="2" fill="#FFFFFF" />
        <circle cx="36" cy="30" r="4" stroke="#E5B84B" stroke-width="1.6" fill="none" />
      </g>

      <!-- เหรียญลอย 3 (จิ๋ว) -->
      <circle cx="58" cy="20" r="4.5" stroke="#43303A" stroke-width="1.8" fill="#FFFFFF" />
      <circle cx="58" cy="20" r="2" fill="#E5B84B" />

      <!-- ประกาย -->
      <path
        d="M98 38 L98 44 M95 41 L101 41"
        stroke="#E5B84B"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M22 20 L22 25 M19.5 22.5 L24.5 22.5"
        stroke="#E5B84B"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>

    <p class="text-body-2 text-medium-emphasis mb-0">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>
