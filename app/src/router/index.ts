import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/doctors',
      name: 'doctors',
      component: () => import('../views/Doctors.vue'),
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('../views/Appointments.vue'),
    },
    {
      path: '/patients',
      name: 'patients',
      component: () => import('../views/Patients.vue'),
    },
    {
      path: '/records',
      name: 'records',
      component: () => import('../views/Records.vue'),
    },
  ],
})

export default router
