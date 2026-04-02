<script setup lang="ts">
const router = useRouter()

// TODO: Reemplazar esta lógica con autenticación real
// Por ahora: Si no estás autenticado, ir a login
// En futuro: Validar token y mostrar dashboard

// Para testing: Descomentar la línea siguiente para ir a property detail:
// navigateTo('/properties/22222222-2222-2222-2222-222222222222')

navigateTo('/login')
</script>

<template>
  <div />
</template>
