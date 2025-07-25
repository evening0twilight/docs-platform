import { defineStore } from 'pinia'

interface UserState {
  token: string
  name: string
  avatar: string
  roles: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    name: '',
    avatar: '',
    roles: []
  }),
  actions: {
    setUser(user: UserState) {
      this.token = user.token
      this.name = user.name
      this.avatar = user.avatar
      this.roles = user.roles
    }
  }
})
