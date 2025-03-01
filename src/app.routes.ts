export default [
  {
    path: '/',
    name: 'index',
    component: () => import('./views/Home.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/Login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./views/Register.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/Profile.vue'),
  },
  {
    path: '/add-song',
    name: 'addSong',
    component: () => import('./views/AddSong.vue'),
  },
  {
    path: '/song/:id',
    name: 'songDetail',
    component: () => import('./views/SongDetail.vue'),
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('./views/Favorites.vue'),
  },
  {
    path: '/repertoires',
    name: 'repertoires',
    component: () => import('./views/Repertoires.vue'),
  },
  {
    path: '/private-songs',
    name: 'private-songs',
    component: () => import('./views/PrivateSongs.vue'),
  },
];
