import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  url?: string
}

export interface MenuItem {
  heading?: string
  children?: ChildItem[]
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'Portfolio Admin',
    children: [
      {
        name: 'Overview',
        icon: 'solar:widget-add-line-duotone',
        id: uniqueId(),
        url: '/',
      },
      {
        name: 'Journey',
        icon: 'solar:route-linear',
        id: uniqueId(),
        url: '/portfolio/experience',
      },
      {
        name: 'Stack',
        icon: 'solar:programming-linear',
        id: uniqueId(),
        url: '/portfolio/skills',
      },
      {
        name: 'Projects',
        icon: 'solar:case-round-linear',
        id: uniqueId(),
        url: '/portfolio/projects',
      },
      {
        name: 'Blog',
        icon: 'solar:notebook-linear',
        id: uniqueId(),
        url: '/portfolio/blog',
      },
      {
        name: 'Articles',
        icon: 'solar:document-text-linear',
        id: uniqueId(),
        url: '/portfolio/articles',
      },
      {
        name: 'Gallery',
        icon: 'solar:gallery-linear',
        id: uniqueId(),
        url: '/portfolio/gallery',
      },
      {
        name: 'Profile Settings',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/portfolio/profile',
      },
      {
        name: 'CV / Resume',
        icon: 'solar:document-bold-linear',
        id: uniqueId(),
        url: '/portfolio/cv',
      },
      {
        name: 'Messages',
        icon: 'solar:letter-linear',
        id: uniqueId(),
        url: '/portfolio/contact',
      },
    ],
  },
]

export default SidebarContent
