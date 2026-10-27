<!-- src/components/dashboard/HeroArt.vue -->
<template>
  <svg
    width="200"
    height="140"
    viewBox="0 0 200 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <g id="hero-art-baht" stroke="#E5B84B" fill="none" stroke-linecap="round">
        <path d="M0 -5 L0 5" />
        <path
          d="M-2.5 -2 C-2.5 -3.3 -1.4 -4 0 -4 C1.4 -4 2.5 -3.3 2.5 -2 C2.5 -0.7 1.4 -0.3 0 0 C-1.4 0.3 -2.5 0.7 -2.5 2 C-2.5 3.3 -1.4 4 0 4 C1.4 4 2.5 3.3 2.5 2"
        />
      </g>
    </defs>

    <!-- เส้น guilloche บาง ๆ -->
    <g stroke="#E5B84B" stroke-width="1" fill="none" opacity="0.4">
      <path
        d="M0 30 C12.5 12 37.5 12 50 30 C62.5 48 87.5 48 100 30 C112.5 12 137.5 12 150 30 C162.5 48 187.5 48 200 30"
      />
      <path
        d="M0 76 C12.5 94 37.5 94 50 76 C62.5 58 87.5 58 100 76 C112.5 94 137.5 94 150 76 C162.5 58 187.5 58 200 76"
      />
      <path
        d="M0 120 C12.5 102 37.5 102 50 120 C62.5 138 87.5 138 100 120 C112.5 102 137.5 102 150 120 C162.5 138 187.5 138 200 120"
      />
    </g>

    <!-- เหรียญ ฿ ซ้อน 3 -->
    <g>
      <circle cx="52" cy="92" r="34" fill="#43303A" stroke="#E5B84B" stroke-width="2" />
      <circle cx="52" cy="92" r="27" fill="none" stroke="#E5B84B" stroke-width="1" opacity="0.55" />
      <use href="#hero-art-baht" transform="translate(52 92) scale(2.6)" stroke-width="0.85" />
    </g>
    <g>
      <circle cx="100" cy="74" r="40" fill="#43303A" stroke="#E5B84B" stroke-width="2" />
      <circle
        cx="100"
        cy="74"
        r="31"
        fill="none"
        stroke="#E5B84B"
        stroke-width="1"
        opacity="0.55"
      />
      <use href="#hero-art-baht" transform="translate(100 74) scale(3)" stroke-width="0.75" />
    </g>
    <g>
      <circle cx="152" cy="56" r="32" fill="#43303A" stroke="#E5B84B" stroke-width="2" />
      <circle
        cx="152"
        cy="56"
        r="25"
        fill="none"
        stroke="#E5B84B"
        stroke-width="1"
        opacity="0.55"
      />
      <use href="#hero-art-baht" transform="translate(152 56) scale(2.4)" stroke-width="0.9" />
    </g>
  </svg>
</template>
