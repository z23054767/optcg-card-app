<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 relative">
    <ChatSidebar :open="sidebarOpen" :rooms="chat.rooms" :current-room-id="chat.currentRoomId"
      @close="sidebarOpen = false" @switch-room="switchRoom" />

    <div class="flex min-h-0 flex-1 flex-col min-w-0 bg-white shadow-lg">
      <ChatHeader :title="currentRoomTitle" :current-room-id="chat.currentRoomId" :room-type="currentRoomType"
        :avatar-url="currentRoomAvatarUrl" :user-name="auth.user?.displayName || auth.user?.name || '使用者'"
        :user-account="auth.user?.name ? `@${auth.user.name}` : ''" :user-id="auth.user?.userId || null"
        :user-avatar-url="resolvedUserAvatarUrl" :online-count="chat.currentRoomOnlineCount"
        :unread-notification-count="notificationCount" :show-create-button="canCreateRoom"
        :show-private-chat-button="canStartPrivateChat" :show-invite-members-button="canInviteMembers"
        :show-manage-group-button="canManageGroup" :show-members-button="isCurrentGroupRoom"
        @create-room="showCreateRoom = true" @start-private-chat="showPrivateChat = true" @back-to-lobby="backToLobby"
        @toggle-sidebar="toggleSidebar" @toggle-user-menu="toggleUserMenu" @open-members="openRoomMembers"
        @invite-members="showInviteMembers = true" @open-manage-group="openGroupManage" />

      <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false"></div>
      <UserMenu :open="showUserMenu" :display-name="auth.user?.displayName || auth.user?.name || '使用者'"
        :name="auth.user?.name || ''" :avatar-url="resolvedUserAvatarUrl" :invitation-count="notificationCount"
        @close="showUserMenu = false" @logout="logout" @open-invitations="openInvitations"
        @open-settings="openProfileSettings" />

      <ProfileSettingsModal v-if="showProfileSettings && userProfile" :profile="userProfile"
        @close="showProfileSettings = false" @saved="handleProfileSaved" />

      <CreateRoomModal v-if="showCreateRoom" :loading="creatingRoom" @close="showCreateRoom = false"
        @create="createRoom" />
      <PrivateChatModal v-if="showPrivateChat" :users="privateChatUsers" :searching="searchingPrivateUsers"
        :inviting="creatingPrivateChat" :inviting-user-id="invitingPrivateUserId" :searched="privateUserSearched"
        @close="closePrivateChatModal" @search="searchPrivateUsers" @clear="clearPrivateUserSearch"
        @invite="createPrivateChat" />
      <InviteMembersModal v-if="showInviteMembers" :room-id="chat.currentRoomId" :loading="invitingMembers"
        @close="showInviteMembers = false" @invite="inviteMembers" />
      <GroupManageModal v-if="showGroupManage && currentRoom" :room="currentRoom" :members="roomMembers"
        :loading-members="loadingRoomMembers" :updating-info="updatingGroupInfo" :deleting-room="deletingGroupRoom"
        :removing-user-id="removingMemberUserId" :transferring-user-id="transferringManagerUserId"
        :invitations="roomInvitations" :loading-invitations="loadingRoomInvitations"
        :re-inviting-invitee-id="reInvitingInviteeId" @close="showGroupManage = false" @save-info="saveGroupInfo"
        @remove-member="removeMember" @transfer-manager="transferManager" @delete-room="deleteGroupRoom"
        @re-invite="reInvite" />

      <InvitationModal v-if="showInvitations" :invitations="chat.invitations" :friend-requests="friendRequests"
        :processing-friend-request-id="processingFriendRequestId" @close="showInvitations = false"
        @accept-invitation="acceptInvitation" @reject-invitation="rejectInvitation"
        @accept-friend-request="acceptFriendRequest" @reject-friend-request="rejectFriendRequest" />
      <RoomMembersModal v-if="showRoomMembers" :members="roomMembers" :loading="loadingRoomMembers"
        @close="showRoomMembers = false" />

      <main ref="messagesEl" class="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 sm:px-4"
        @scroll="handleMessageScroll">
        <ChatMessageTimeline :messages="filteredMessages" :loading-older-messages="loadingOlderMessages"
          :show-scroll-button="showScrollButton" :date-anchor="dateLabelAnchor"
          @scroll-button-click="handleScrollButtonClick" />
      </main>

      <footer class="border-t bg-white px-3 py-2">
        <ChatInput />
      </footer>

      <WelcomePopup :visible="chat.welcomePopup.visible" :message="chat.welcomePopup.message" />

      <!-- Toast 通知 -->
      <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
        <div v-if="toast"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-none"
          :class="toast.type === 'success' ? 'bg-gray-800' : 'bg-red-600'">
          {{ toast.type === 'success' ? '✓ ' : '✕ ' }}{{ toast.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages } from '@/composables/useChatMessages'
import { useChatRoomModals } from '@/composables/useChatRoomModals'
import { useChatRoomSession } from '@/composables/useChatRoomSession'
import UserMenu from '@/components/UserMenu.vue'
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import ChatMessageTimeline from '@/components/ChatMessageTimeline.vue'
import ChatInput from '@/components/ChatInput.vue'
import WelcomePopup from '@/components/WelcomePopup.vue'
import InvitationModal from '@/components/InvitationModal.vue'
import CreateRoomModal from '@/components/CreateRoomModal.vue'
import InviteMembersModal from '@/components/InviteMembersModal.vue'
import PrivateChatModal from '@/components/PrivateChatModal.vue'
import RoomMembersModal from '@/components/RoomMembersModal.vue'
import GroupManageModal from '@/components/GroupManageModal.vue'
import ProfileSettingsModal from '@/components/ProfileSettingsModal.vue'

const auth = useAuthStore()
const chat = useChatStore()
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 3000)
}

const session = useChatRoomSession()
const messages = useChatMessages()
const modals = useChatRoomModals({
  showUserMenu: session.showUserMenu,
  loadMyRooms: session.loadMyRooms,
  loadMyProfile: session.loadMyProfile,
  switchRoom: session.switchRoom,
  showToast,
})

session.initializeSession({
  messages,
  modals,
  showToast,
})

const sidebarOpen = session.sidebarOpen
const showUserMenu = session.showUserMenu
const currentRoom = session.currentRoom
const currentRoomTitle = session.currentRoomTitle
const currentRoomType = session.currentRoomType
const currentRoomAvatarUrl = session.currentRoomAvatarUrl
const isCurrentGroupRoom = session.isCurrentGroupRoom
const canCreateRoom = session.canCreateRoom
const canStartPrivateChat = session.canStartPrivateChat
const canInviteMembers = session.canInviteMembers
const canManageGroup = session.canManageGroup
const resolvedUserAvatarUrl = session.resolvedUserAvatarUrl
const notificationCount = modals.notificationCount

const filteredMessages = messages.filteredMessages
const messagesEl = messages.messagesEl
const loadingOlderMessages = messages.loadingOlderMessages
const showScrollButton = messages.showScrollButton
const dateLabelAnchor = messages.dateLabelAnchor

const showCreateRoom = modals.showCreateRoom
const creatingRoom = modals.creatingRoom
const showPrivateChat = modals.showPrivateChat
const creatingPrivateChat = modals.creatingPrivateChat
const searchingPrivateUsers = modals.searchingPrivateUsers
const privateUserSearched = modals.privateUserSearched
const invitingPrivateUserId = modals.invitingPrivateUserId
const privateChatUsers = modals.privateChatUsers
const showProfileSettings = modals.showProfileSettings
const userProfile = modals.userProfile
const showInvitations = modals.showInvitations
const showRoomMembers = modals.showRoomMembers
const showInviteMembers = modals.showInviteMembers
const showGroupManage = modals.showGroupManage
const invitingMembers = modals.invitingMembers
const updatingGroupInfo = modals.updatingGroupInfo
const deletingGroupRoom = modals.deletingGroupRoom
const removingMemberUserId = modals.removingMemberUserId
const transferringManagerUserId = modals.transferringManagerUserId
const reInvitingInviteeId = modals.reInvitingInviteeId
const loadingRoomMembers = modals.loadingRoomMembers
const loadingRoomInvitations = modals.loadingRoomInvitations
const roomMembers = modals.roomMembers
const roomInvitations = modals.roomInvitations
const friendRequests = modals.friendRequests
const processingFriendRequestId = modals.processingFriendRequestId

const handleMessageScroll = messages.handleMessageScroll
const handleScrollButtonClick = messages.handleScrollButtonClick

const switchRoom = session.switchRoom
const backToLobby = session.backToLobby
const toggleSidebar = session.toggleSidebar
const toggleUserMenu = session.toggleUserMenu
const logout = session.logout

const createRoom = modals.createRoom
const searchPrivateUsers = modals.searchPrivateUsers
const clearPrivateUserSearch = modals.clearPrivateUserSearch
const closePrivateChatModal = modals.closePrivateChatModal
const createPrivateChat = modals.createPrivateChat
const acceptInvitation = modals.acceptInvitation
const acceptFriendRequest = modals.acceptFriendRequest
const rejectFriendRequest = modals.rejectFriendRequest
const rejectInvitation = modals.rejectInvitation
const inviteMembers = modals.inviteMembers
const openRoomMembers = modals.openRoomMembers
const openGroupManage = modals.openGroupManage
const reInvite = modals.reInvite
const saveGroupInfo = modals.saveGroupInfo
const removeMember = modals.removeMember
const transferManager = modals.transferManager
const deleteGroupRoom = modals.deleteGroupRoom
const openProfileSettings = modals.openProfileSettings
const handleProfileSaved = modals.handleProfileSaved
const openInvitations = modals.openInvitations
</script>
