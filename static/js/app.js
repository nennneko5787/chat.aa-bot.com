// Global state
let currentUser = null;
let currentChannel = null;
let users = [];
let channels = [];
let roles = [];
let selectedChannelForDeletion = null;
let selectedMemberForRoles = null;
let selectedRoleForEdit = null;

// DOM Elements
const messagesContainer = document.getElementById("messages-container");
const messageInput = document.getElementById("message-input");
const membersList = document.getElementById("members-list");
const channelsList = document.querySelector(".channels-list");
const addChannelBtn = document.getElementById("add-channel-btn");
const serverSettingsBtn = document.getElementById("server-settings-btn");

// Context menu elements
const channelContextMenu = document.getElementById("channel-context-menu");
const messageContextMenu = document.getElementById("message-context-menu");
const memberContextMenu = document.getElementById("member-context-menu");

// Modal elements
const channelModal = document.getElementById("channel-modal");
const deleteChannelModal = document.getElementById("delete-channel-modal");
const channelPermissionsModal = document.getElementById("channel-permissions-modal");
const serverSettingsModal = document.getElementById("server-settings-modal");
const roleModal = document.getElementById("role-modal");
const memberRolesModal = document.getElementById("member-roles-modal");
const modalOverlay = document.getElementById("modal-overlay");

// Loading indicators
const loadingOverlay = document.createElement("div");
loadingOverlay.className = "loading-overlay";
loadingOverlay.innerHTML = `
  <div class="loading-spinner"></div>
  <div class="loading-text">Loading...</div>
`;
document.body.appendChild(loadingOverlay);

// API object (replace with your actual API implementation)
const APIPath = {
  Auth: {
    getCurrentUser: async () => {
      // Simulate fetching current user
      return new Promise((resolve) => {
        setTimeout(() => {
          const token = localStorage.getItem("token");
          if (token) {
            // Simulate user data
            const userData = localStorage.getItem("user");
            resolve(userData);
          } else {
            resolve(null);
          }
        }, 500);
      });
    },
  },
  Users: {
    getUsers: async () => {
      // Simulate fetching users
      return new Promise((resolve) => {
        setTimeout(() => {
          const users = JSON.parse(localStorage.getItem("users") || "[]");
          resolve({ users });
        }, 500);
      });
    },
    updateUserRoles: async (userId, roleIds) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const users = JSON.parse(localStorage.getItem("users") || "[]");
          const userIndex = users.findIndex((u) => u.id === userId);
          if (userIndex !== -1) {
            users[userIndex].roles = roleIds;
            localStorage.setItem("users", JSON.stringify(users));
            resolve({ success: true });
          } else {
            resolve({ success: false, error: "User not found" });
          }
        }, 500);
      });
    },
  },
  Channels: {
    getChannels: async () => {
      // Simulate fetching channels
      return new Promise((resolve) => {
        setTimeout(() => {
          const channels = JSON.parse(localStorage.getItem("channels") || "[]");
          resolve({ channels });
        }, 500);
      });
    },
    createChannel: async (channelData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const channels = JSON.parse(localStorage.getItem("channels") || "[]");
          const newChannel = {
            id: Date.now().toString(), // Simulate ID generation
            ...channelData,
          };
          channels.push(newChannel);
          localStorage.setItem("channels", JSON.stringify(channels));
          resolve({ channel: newChannel });
        }, 500);
      });
    },
    deleteChannel: async (channelId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let channels = JSON.parse(localStorage.getItem("channels") || "[]");
          channels = channels.filter((c) => c.id !== channelId);
          localStorage.setItem("channels", JSON.stringify(channels));
          resolve({ success: true });
        }, 500);
      });
    },
    updateChannelPermissions: async (channelId, permissions) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const channels = JSON.parse(localStorage.getItem("channels") || "[]");
          const channelIndex = channels.findIndex((c) => c.id === channelId);
          if (channelIndex !== -1) {
            channels[channelIndex].rolePermissions = permissions;
            localStorage.setItem("channels", JSON.stringify(channels));
            resolve({ success: true });
          } else {
            resolve({ success: false, error: "Channel not found" });
          }
        }, 500);
      });
    },
  },
  Messages: {
    getMessages: async (channelId) => {
      // Simulate fetching messages
      return new Promise((resolve) => {
        setTimeout(() => {
          const messages = JSON.parse(localStorage.getItem("messages") || "[]").filter(
            (m) => m.channelId === channelId
          );
          resolve({ messages });
        }, 500);
      });
    },
    sendMessage: async (channelId, content) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const messages = JSON.parse(localStorage.getItem("messages") || "[]");
          const newMessage = {
            id: Date.now().toString(), // Simulate ID generation
            channelId,
            userId: currentUser.id,
            content,
            timestamp: new Date().toISOString(),
          };
          messages.push(newMessage);
          localStorage.setItem("messages", JSON.stringify(messages));
          resolve({ message: newMessage });
        }, 500);
      });
    },
  },
  Roles: {
    getRoles: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const roles = JSON.parse(localStorage.getItem("roles") || "[]");
          resolve({ roles });
        }, 500);
      });
    },
    createRole: async (roleData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const roles = JSON.parse(localStorage.getItem("roles") || "[]");
          const newRole = {
            id: Date.now().toString(), // Simulate ID generation
            ...roleData,
          };
          roles.push(newRole);
          localStorage.setItem("roles", JSON.stringify(roles));
          resolve({ role: newRole });
        }, 500);
      });
    },
    updateRole: async (roleId, roleData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const roles = JSON.parse(localStorage.getItem("roles") || "[]");
          const roleIndex = roles.findIndex((r) => r.id === roleId);
          if (roleIndex !== -1) {
            roles[roleIndex] = { ...roles[roleIndex], ...roleData };
            localStorage.setItem("roles", JSON.stringify(roles));
            resolve({ role: roles[roleIndex] });
          } else {
            resolve({ success: false, error: "Role not found" });
          }
        }, 500);
      });
    },
    deleteRole: async (roleId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let roles = JSON.parse(localStorage.getItem("roles") || "[]");
          roles = roles.filter((r) => r.id !== roleId);
          localStorage.setItem("roles", JSON.stringify(roles));
          resolve({ success: true });
        }, 500);
      });
    },
  },
};

// WebSocket connection
let socket;

// Show loading overlay
function showLoading() {
  loadingOverlay.style.display = "flex";
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.style.display = "none";
}

// Show error message
function showError(message) {
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;

  document.body.appendChild(errorElement);

  setTimeout(() => {
    errorElement.classList.add("show");

    setTimeout(() => {
      errorElement.classList.remove("show");
      setTimeout(() => {
        errorElement.remove();
      }, 300);
    }, 3000);
  }, 10);
}

// Initialize the application
async function init() {
  showLoading();

  try {
    // First, get current user info
    currentUser = await APIPath.Auth.getCurrentUser();

    if (!currentUser) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    // Set admin status if applicable
    if (currentUser.isAdmin) {
      document.body.classList.add("is-admin");
    }

    // Update user info in UI
    updateUserInfo(currentUser);

    // Fetch roles, users, and channels
    await Promise.all([fetchRoles(), fetchUsers(), fetchChannels()]);

    // Set up event listeners
    setupEventListeners();

    // Connect to WebSocket
    connectWebSocket();

    // Hide loading overlay
    hideLoading();
  } catch (error) {
    console.error("Initialization error:", error);
    hideLoading();
    showError("Failed to initialize application. Please try again later.");
  }
}

// Update user info in the UI
function updateUserInfo(user) {
  const userAvatar = document.querySelector(".user-info .user-avatar img");
  const username = document.querySelector(".user-info .username");
  const userId = document.querySelector(".user-info .user-id");
  const statusIndicator = document.querySelector(".user-info .status-indicator");

  if (userAvatar) userAvatar.src = user.avatar || "https://via.placeholder.com/32";
  if (username) username.textContent = user.username;
  if (userId) userId.textContent = `#${user.id}`;
  if (statusIndicator) {
    statusIndicator.className = "status-indicator";
    statusIndicator.classList.add(user.status || "online");
  }
}

// Fetch roles from API
async function fetchRoles() {
  try {
    const response = await APIPath.Roles.getRoles();
    roles = response.roles || [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    showError("Failed to load roles");
  }
}

// Fetch users from API
async function fetchUsers() {
  try {
    const response = await APIPath.Users.getUsers();
    users = response.users || [];
    renderMembers();
  } catch (error) {
    console.error("Error fetching users:", error);
    showError("Failed to load users");
  }
}

// Fetch channels from API
async function fetchChannels() {
  try {
    const response = await APIPath.Channels.getChannels();
    channels = response.channels || [];
    renderChannels();

    // Select first channel by default
    if (channels.length > 0) {
      switchChannel(channels[0]);
    }
  } catch (error) {
    console.error("Error fetching channels:", error);
    showError("Failed to load channels");
  }
}

// Fetch messages for a channel
async function fetchMessages(channelId) {
  try {
    showLoading();
    const response = await APIPath.Messages.getMessages(channelId);
    renderMessages(response.messages || []);
    hideLoading();
  } catch (error) {
    console.error(`Error fetching messages for channel ${channelId}:`, error);
    showError("Failed to load messages");
    hideLoading();
  }
}

// Render channels in the sidebar
function renderChannels() {
  channelsList.innerHTML = "";

  // Filter channels based on user's roles and permissions
  const visibleChannels = channels.filter((channel) => {
    // If the user is an admin, they can see all channels
    if (currentUser.isAdmin) return true;

    // If the channel has no role restrictions, everyone can see it
    if (!channel.rolePermissions || channel.rolePermissions.length === 0) return true;

    // Check if the user has any of the roles that can view this channel
    const userRoles = currentUser.roles || [];
    return channel.rolePermissions.some((permission) => userRoles.includes(permission.roleId));
  });

  visibleChannels.forEach((channel) => {
    const channelElement = document.createElement("div");
    channelElement.className = "channel";
    channelElement.dataset.channelId = channel.id;

    if (channel.adminOnly) {
      channelElement.classList.add("admin-only");
    }

    channelElement.innerHTML = `
      <span class="channel-hash">#</span>
      <span class="channel-name">${channel.name}</span>
      ${channel.adminOnly ? '<span class="admin-badge" title="Admin Only">🔒</span>' : ""}
    `;

    channelsList.appendChild(channelElement);

    // Add click event listener
    channelElement.addEventListener("click", () => {
      switchChannel(channel);
    });

    // Add context menu event listener
    channelElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      selectedChannelForDeletion = channel;
      showContextMenu(e, channelContextMenu);
    });
  });

  // Show/hide add channel button based on admin status
  if (addChannelBtn) {
    addChannelBtn.style.display = currentUser && currentUser.isAdmin ? "block" : "none";
  }
}

// Render members in the sidebar
function renderMembers() {
  membersList.innerHTML = "";

  users.forEach((user) => {
    const memberElement = document.createElement("div");
    memberElement.className = "member";
    memberElement.dataset.userId = user.id;

    // Get user's roles
    const userRoles = user.roles || [];

    // Find the highest role for display
    let highestRole = null;
    if (userRoles.length > 0) {
      // Sort roles by position (higher position = more important)
      const userRoleObjects = roles.filter((role) => userRoles.includes(role.id));
      if (userRoleObjects.length > 0) {
        userRoleObjects.sort((a, b) => b.position - a.position);
        highestRole = userRoleObjects[0];
      }
    }

    let roleSpan = "";
    if (user.isAdmin) {
      roleSpan = `<span class="member-role admin">Admin</span>`;
    } else if (highestRole) {
      const roleColor = highestRole.color || "#5865f2";
      roleSpan = `<span class="member-role" style="background-color: ${roleColor}">${highestRole.name}</span>`;
    }

    memberElement.innerHTML = `
      <div class="member-avatar">
        <img src="${user.avatar || "https://via.placeholder.com/32"}" alt="${user.username}">
        <span class="member-status ${user.status || "offline"}"></span>
      </div>
      <div class="member-name">${user.username}</div>
      ${roleSpan}
    `;

    membersList.appendChild(memberElement);

    // Add context menu event listener
    memberElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      selectedMemberForRoles = user;
      showContextMenu(e, memberContextMenu);

      // Add or remove admin-specific classes
      if (currentUser && currentUser.isAdmin) {
        memberContextMenu.classList.add("is-admin");
      } else {
        memberContextMenu.classList.remove("is-admin");
      }
    });
  });
}

// Format timestamp to a readable format
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Render messages in the chat
function renderMessages(messages) {
  const messagesWrapper = document.getElementById("messages-wrapper") || document.createElement("div");
  messagesWrapper.id = "messages-wrapper";
  messagesWrapper.className = "messages-wrapper";
  messagesWrapper.innerHTML = "";

  if (messages.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-messages";
    emptyMessage.textContent = "No messages yet. Be the first to send a message!";
    messagesWrapper.appendChild(emptyMessage);
  } else {
    messages.forEach((message) => {
      const user = users.find((u) => u.id === message.userId);
      if (!user) return;

      const messageElement = document.createElement("div");
      messageElement.className = "message";
      messageElement.dataset.messageId = message.id;
      messageElement.dataset.userId = message.userId;

      messageElement.innerHTML = `
        <div class="message-avatar">
          <img src="${user.avatar || "https://via.placeholder.com/40"}" alt="${user.username}">
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${user.username}</span>
            <span class="message-timestamp">${formatTimestamp(message.timestamp)}</span>
          </div>
          <div class="message-text">${escapeHTML(message.content)}</div>
        </div>
      `;

      messagesWrapper.appendChild(messageElement);

      // Add context menu event listener
      messageElement.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showContextMenu(e, messageContextMenu);

        // Check if current user is the message owner
        if (currentUser && message.userId === currentUser.id) {
          messageContextMenu.classList.add("is-message-owner");
        } else {
          messageContextMenu.classList.remove("is-message-owner");
        }
      });
    });
  }

  // Replace the content of messagesContainer with the wrapper
  messagesContainer.innerHTML = "";
  messagesContainer.appendChild(messagesWrapper);

  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add a new message to the chat
async function sendMessage(content) {
  if (!currentChannel || !content.trim()) return;

  try {
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      userId: currentUser.id,
      content: content,
      timestamp: new Date().toISOString(),
      pending: true,
    };

    addMessageToUI(tempMessage);

    // Send to API
    const response = await APIPath.Messages.sendMessage(currentChannel.id, content);
    const sentMessage = response.message;

    // Replace temp message with real one
    const tempElement = document.querySelector(`.message[data-message-id="${tempId}"]`);
    if (tempElement) {
      tempElement.dataset.messageId = sentMessage.id;
      tempElement.classList.remove("pending");
    }

    return sentMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    showError("Failed to send message");

    // Remove the pending message
    const tempElement = document.querySelector(`.message[data-message-id="temp-${Date.now()}"]`);
    if (tempElement) {
      tempElement.remove();
    }
  }
}

// Add a message to the UI
function addMessageToUI(message) {
  const user = users.find((u) => u.id === message.userId);
  if (!user) return;

  const messagesWrapper = document.getElementById("messages-wrapper");
  if (!messagesWrapper) return;

  const messageElement = document.createElement("div");
  messageElement.className = "message";
  if (message.pending) {
    messageElement.classList.add("pending");
  }

  messageElement.dataset.messageId = message.id;
  messageElement.dataset.userId = message.userId;

  messageElement.innerHTML = `
    <div class="message-avatar">
      <img src="${user.avatar || "https://via.placeholder.com/40"}" alt="${user.username}">
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${user.username}</span>
        <span class="message-timestamp">${formatTimestamp(message.timestamp)}</span>
      </div>
      <div class="message-text">${escapeHTML(message.content)}</div>
    </div>
  `;

  messagesWrapper.appendChild(messageElement);

  // Add context menu event listener
  messageElement.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showContextMenu(e, messageContextMenu);

    // Check if current user is the message owner
    if (currentUser && message.userId === currentUser.id) {
      messageContextMenu.classList.add("is-message-owner");
    } else {
      messageContextMenu.classList.remove("is-message-owner");
    }
  });

  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show context menu at the specified position
function showContextMenu(event, menu) {
  // Hide all other context menus first
  hideAllContextMenus();

  // Position the menu
  const x = event.clientX;
  const y = event.clientY;

  // Check if menu would go off screen
  const menuWidth = 180;
  const menuHeight = menu.offsetHeight || 150; // Estimate if not rendered yet

  let posX = x;
  let posY = y;

  if (x + menuWidth > window.innerWidth) {
    posX = window.innerWidth - menuWidth - 5;
  }

  if (y + menuHeight > window.innerHeight) {
    posY = window.innerHeight - menuHeight - 5;
  }

  menu.style.left = posX + "px";
  menu.style.top = posY + "px";
  menu.classList.add("show");

  // Add click event to hide menu when clicking elsewhere
  setTimeout(() => {
    document.addEventListener("click", hideAllContextMenus, { once: true });
  }, 0);
}

// Hide all context menus
function hideAllContextMenus() {
  const menus = document.querySelectorAll(".context-menu");
  menus.forEach((menu) => {
    menu.classList.remove("show");
  });
}

// Show modal
function showModal(modal) {
  modalOverlay.style.display = "block";
  modal.style.display = "block";
}

// Hide modal
function hideModal(modal) {
  modalOverlay.style.display = "none";
  modal.style.display = "none";
}

// Add a new channel
async function createChannel(name, topic, adminOnly, rolePermissions) {
  try {
    showLoading();

    const channelData = {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      topic: topic || `Welcome to #${name}`,
      adminOnly: adminOnly,
      rolePermissions: rolePermissions || [],
    };

    const response = await APIPath.Channels.createChannel(channelData);
    const newChannel = response.channel;

    // Add to local channels array
    channels.push(newChannel);

    // Update UI
    renderChannels();

    hideLoading();
    return newChannel;
  } catch (error) {
    console.error("Error creating channel:", error);
    showError("Failed to create channel");
    hideLoading();
    return null;
  }
}

// Delete a channel
async function deleteChannel(channelId) {
  try {
    showLoading();

    await APIPath.Channels.deleteChannel(channelId);

    // Remove from local array
    const index = channels.findIndex((c) => c.id === channelId);
    if (index !== -1) {
      channels.splice(index, 1);
    }

    // Update UI
    renderChannels();

    // If current channel was deleted, switch to first available channel
    if (currentChannel && currentChannel.id === channelId) {
      if (channels.length > 0) {
        switchChannel(channels[0]);
      } else {
        currentChannel = null;
        document.querySelector(".chat-header .channel-name").textContent = "";
        document.querySelector(".channel-topic").textContent = "";
        document.getElementById("message-input").placeholder = "No channels available";
        renderMessages([]);
      }
    }

    hideLoading();
    return true;
  } catch (error) {
    console.error("Error deleting channel:", error);
    showError("Failed to delete channel");
    hideLoading();
    return false;
  }
}

// Update channel permissions
async function updateChannelPermissions(channelId, permissions) {
  try {
    showLoading();

    await APIPath.Channels.updateChannelPermissions(channelId, permissions);

    // Update local channel data
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      channel.rolePermissions = permissions;
    }

    hideLoading();
    return true;
  } catch (error) {
    console.error("Error updating channel permissions:", error);
    showError("Failed to update channel permissions");
    hideLoading();
    return false;
  }
}

// Create a new role
async function createRole(roleData) {
  try {
    showLoading();

    const response = await APIPath.Roles.createRole(roleData);
    const newRole = response.role;

    // Add to local roles array
    roles.push(newRole);

    hideLoading();
    return newRole;
  } catch (error) {
    console.error("Error creating role:", error);
    showError("Failed to create role");
    hideLoading();
    return null;
  }
}

// Update a role
async function updateRole(roleId, roleData) {
  try {
    showLoading();

    const response = await APIPath.Roles.updateRole(roleId, roleData);
    const updatedRole = response.role;

    // Update local roles array
    const index = roles.findIndex((r) => r.id === roleId);
    if (index !== -1) {
      roles[index] = updatedRole;
    }

    hideLoading();
    return updatedRole;
  } catch (error) {
    console.error("Error updating role:", error);
    showError("Failed to update role");
    hideLoading();
    return null;
  }
}

// Delete a role
async function deleteRole(roleId) {
  try {
    showLoading();

    await APIPath.Roles.deleteRole(roleId);

    // Remove from local array
    const index = roles.findIndex((r) => r.id === roleId);
    if (index !== -1) {
      roles.splice(index, 1);
    }

    hideLoading();
    return true;
  } catch (error) {
    console.error("Error deleting role:", error);
    showError("Failed to delete role");
    hideLoading();
    return false;
  }
}

// Update user roles
async function updateUserRoles(userId, roleIds) {
  try {
    showLoading();

    await APIPath.Users.updateUserRoles(userId, roleIds);

    // Update local user data
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.roles = roleIds;
    }

    // Re-render members to show updated roles
    renderMembers();

    hideLoading();
    return true;
  } catch (error) {
    console.error("Error updating user roles:", error);
    showError("Failed to update user roles");
    hideLoading();
    return false;
  }
}

// Switch to a different channel
async function switchChannel(channel) {
  if (!channel || (currentChannel && currentChannel.id === channel.id)) return;

  currentChannel = channel;

  // Update UI
  document.querySelectorAll(".channel").forEach((el) => {
    el.classList.remove("active");
    if (el.dataset.channelId == channel.id) {
      el.classList.add("active");
    }
  });

  document.querySelector(".chat-header .channel-name").textContent = channel.name;
  document.querySelector(".channel-topic").textContent = channel.topic || "";
  document.getElementById("message-input").placeholder = `Message #${channel.name}`;

  // Fetch messages for this channel
  await fetchMessages(channel.id);

  // Close the channels sidebar on mobile after selection
  if (window.innerWidth <= 768) {
    document.querySelector(".channels-sidebar").classList.remove("show");
  }
}

// Render roles in the server settings
function renderRoles() {
  const rolesList = document.getElementById("roles-list");
  if (!rolesList) return;

  rolesList.innerHTML = "";

  // Sort roles by position (higher position = higher in the list)
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

  sortedRoles.forEach((role) => {
    const roleElement = document.createElement("div");
    roleElement.className = "role-item";
    roleElement.dataset.roleId = role.id;

    const roleColor = role.color || "#5865f2";

    roleElement.innerHTML = `
      <div class="role-color" style="background-color: ${roleColor}"></div>
      <div class="role-name">${role.name}</div>
      <div class="role-actions">
        <button class="role-edit-btn" title="Edit Role">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>
        </button>
        <button class="role-delete-btn" title="Delete Role">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 6V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5zm2-2v2h6V4H9z" fill="currentColor"/></svg>
        </button>
      </div>
    `;

    rolesList.appendChild(roleElement);

    // Add event listeners
    const editBtn = roleElement.querySelector(".role-edit-btn");
    const deleteBtn = roleElement.querySelector(".role-delete-btn");

    editBtn.addEventListener("click", () => {
      selectedRoleForEdit = role;
      showRoleModal(role);
    });

    deleteBtn.addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
        deleteRole(role.id).then(() => {
          renderRoles();
        });
      }
    });
  });
}

// Show role modal for creating or editing a role
function showRoleModal(role = null) {
  const modalTitle = document.getElementById("role-modal-title");
  const roleForm = document.getElementById("role-form");
  const nameInput = document.getElementById("role-name-input");
  const colorInput = document.getElementById("role-color-input");
  const adminCheckbox = document.getElementById("permission-admin");
  const manageChannelsCheckbox = document.getElementById("permission-manage-channels");
  const manageRolesCheckbox = document.getElementById("permission-manage-roles");
  const kickMembersCheckbox = document.getElementById("permission-kick-members");
  const submitBtn = roleForm.querySelector("button[type='submit']");

  if (role) {
    // Editing existing role
    modalTitle.textContent = "Edit Role";
    nameInput.value = role.name;
    colorInput.value = role.color || "#5865f2";
    adminCheckbox.checked = role.permissions?.administrator || false;
    manageChannelsCheckbox.checked = role.permissions?.manageChannels || false;
    manageRolesCheckbox.checked = role.permissions?.manageRoles || false;
    kickMembersCheckbox.checked = role.permissions?.kickMembers || false;
    submitBtn.textContent = "Save Changes";
  } else {
    // Creating new role
    modalTitle.textContent = "Create Role";
    roleForm.reset();
    colorInput.value = "#5865f2";
    submitBtn.textContent = "Create Role";
  }

  showModal(roleModal);
}

// Render channel permissions in the modal
function renderChannelPermissions(channel) {
  const permissionsList = document.getElementById("permissions-role-list");
  if (!permissionsList) return;

  permissionsList.innerHTML = "";

  // Set channel name in the modal
  document.getElementById("permissions-channel-name").textContent = `#${channel.name}`;

  // Get current permissions
  const currentPermissions = channel.rolePermissions || [];

  // Create permission toggles for each role
  roles.forEach((role) => {
    const hasPermission = currentPermissions.some((p) => p.roleId === role.id);

    const permissionItem = document.createElement("div");
    permissionItem.className = "permission-item";
    permissionItem.dataset.roleId = role.id;

    const roleColor = role.color || "#5865f2";

    permissionItem.innerHTML = `
      <div class="role-info">
        <div class="role-color" style="background-color: ${roleColor}"></div>
        <div class="role-name">${role.name}</div>
      </div>
      <div class="permission-toggle">
        <label class="switch">
          <input type="checkbox" class="role-permission-toggle" ${hasPermission ? "checked" : ""}>
          <span class="slider round"></span>
        </label>
      </div>
    `;

    permissionsList.appendChild(permissionItem);
  });
}

// Render member roles in the modal
function renderMemberRoles(user) {
  const memberRolesInfo = document.getElementById("member-roles-info");
  const memberRolesList = document.getElementById("member-roles-list");
  if (!memberRolesInfo || !memberRolesList) return;

  // Set member info
  memberRolesInfo.innerHTML = `
    <div class="member-avatar">
      <img src="${user.avatar || "https://via.placeholder.com/40"}" alt="${user.username}">
    </div>
    <div class="member-name">${user.username}</div>
  `;

  // Clear roles list
  memberRolesList.innerHTML = "";

  // Get user's current roles
  const userRoles = user.roles || [];

  // Create role toggles
  roles.forEach((role) => {
    const hasRole = userRoles.includes(role.id);

    const roleItem = document.createElement("div");
    roleItem.className = "role-toggle-item";
    roleItem.dataset.roleId = role.id;

    const roleColor = role.color || "#5865f2";

    roleItem.innerHTML = `
      <div class="role-info">
        <div class="role-color" style="background-color: ${roleColor}"></div>
        <div class="role-name">${role.name}</div>
      </div>
      <div class="role-toggle">
        <label class="switch">
          <input type="checkbox" class="member-role-toggle" ${hasRole ? "checked" : ""}>
          <span class="slider round"></span>
        </label>
      </div>
    `;

    memberRolesList.appendChild(roleItem);
  });
}

// Set up event listeners
function setupEventListeners() {
  // Mobile navigation event listeners
  const toggleChannelsBtn = document.getElementById("toggle-channels");
  const toggleMembersBtn = document.getElementById("toggle-members");
  const channelsSidebar = document.querySelector(".channels-sidebar");
  const membersSidebar = document.querySelector(".members-sidebar");

  if (toggleChannelsBtn) {
    toggleChannelsBtn.addEventListener("click", () => {
      channelsSidebar.classList.toggle("show");
      if (membersSidebar.classList.contains("show")) {
        membersSidebar.classList.remove("show");
      }
    });
  }

  if (toggleMembersBtn) {
    toggleMembersBtn.addEventListener("click", () => {
      membersSidebar.classList.toggle("show");
      if (channelsSidebar.classList.contains("show")) {
        channelsSidebar.classList.remove("show");
      }
    });
  }

  // Close sidebars when clicking on the chat area
  document.querySelector(".chat-container").addEventListener("click", (e) => {
    // Only close if we're clicking directly on the chat container, not on buttons or sidebars
    if (
      e.target.closest(".mobile-nav") ||
      e.target.closest(".channels-sidebar") ||
      e.target.closest(".members-sidebar")
    ) {
      return;
    }

    if (channelsSidebar.classList.contains("show")) {
      channelsSidebar.classList.remove("show");
    }
    if (membersSidebar.classList.contains("show")) {
      membersSidebar.classList.remove("show");
    }
  });

  // Send message on Enter key
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && messageInput.value.trim()) {
      const content = messageInput.value.trim();
      sendMessage(content);

      // Clear input
      messageInput.value = "";
    }
  });

  // Add channel button
  if (addChannelBtn) {
    addChannelBtn.addEventListener("click", () => {
      // Reset form
      document.getElementById("channel-form").reset();
      document.getElementById("channel-modal-title").textContent = "Create Channel";

      // Render role permissions in the channel form
      const channelRolePermissions = document.getElementById("channel-role-permissions");
      channelRolePermissions.innerHTML = "";

      roles.forEach((role) => {
        const permissionItem = document.createElement("div");
        permissionItem.className = "permission-item";
        permissionItem.dataset.roleId = role.id;

        const roleColor = role.color || "#5865f2";

        permissionItem.innerHTML = `
          <div class="role-info">
            <div class="role-color" style="background-color: ${roleColor}"></div>
            <div class="role-name">${role.name}</div>
          </div>
          <div class="permission-toggle">
            <label class="switch">
              <input type="checkbox" class="role-permission-toggle" checked>
              <span class="slider round"></span>
            </label>
          </div>
        `;

        channelRolePermissions.appendChild(permissionItem);
      });

      showModal(channelModal);
    });
  }

  // Channel form submission
  document.getElementById("channel-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("channel-name-input").value.trim();
    const topic = document.getElementById("channel-topic-input").value.trim();
    const adminOnly = document.getElementById("admin-only-checkbox").checked;

    // Get role permissions
    const rolePermissions = [];
    document.querySelectorAll("#channel-role-permissions .permission-item").forEach((item) => {
      const roleId = item.dataset.roleId;
      const hasPermission = item.querySelector(".role-permission-toggle").checked;

      if (hasPermission) {
        rolePermissions.push({
          roleId: roleId,
          permission: "VIEW",
        });
      }
    });

    if (name) {
      const newChannel = await createChannel(name, topic, adminOnly, rolePermissions);
      hideModal(channelModal);

      if (newChannel) {
        switchChannel(newChannel);
      }
    }
  });

  // Server settings button
  if (serverSettingsBtn) {
    serverSettingsBtn.addEventListener("click", () => {
      // Show server settings modal
      showModal(serverSettingsModal);

      // Activate the roles tab by default
      document.querySelector(".settings-nav-item[data-tab='roles']").click();
    });
  }

  // Settings navigation tabs
  document.querySelectorAll(".settings-nav-item").forEach((navItem) => {
    navItem.addEventListener("click", () => {
      // Remove active class from all tabs
      document.querySelectorAll(".settings-nav-item").forEach((item) => {
        item.classList.remove("active");
      });
      document.querySelectorAll(".settings-tab").forEach((tab) => {
        tab.classList.remove("active");
      });

      // Add active class to clicked tab
      navItem.classList.add("active");
      const tabId = navItem.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add("active");

      // Load tab-specific content
      if (tabId === "roles") {
        renderRoles();
      } else if (tabId === "members") {
        renderMembersSettings();
      }
    });
  });

  // Add role button
  document.getElementById("add-role-btn").addEventListener("click", () => {
    selectedRoleForEdit = null;
    showRoleModal();
  });

  // Role form submission
  document.getElementById("role-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("role-name-input").value.trim();
    const color = document.getElementById("role-color-input").value;

    const permissions = {
      administrator: document.getElementById("permission-admin").checked,
      manageChannels: document.getElementById("permission-manage-channels").checked,
      manageRoles: document.getElementById("permission-manage-roles").checked,
      kickMembers: document.getElementById("permission-kick-members").checked,
    };

    const roleData = {
      name,
      color,
      permissions,
      position: selectedRoleForEdit ? selectedRoleForEdit.position : roles.length,
    };

    if (selectedRoleForEdit) {
      // Update existing role
      await updateRole(selectedRoleForEdit.id, roleData);
    } else {
      // Create new role
      await createRole(roleData);
    }

    hideModal(roleModal);
    renderRoles();
  });

  // Save permissions button
  document.getElementById("save-permissions").addEventListener("click", async () => {
    if (!selectedChannelForDeletion) return;

    const permissions = [];
    document.querySelectorAll("#permissions-role-list .permission-item").forEach((item) => {
      const roleId = item.dataset.roleId;
      const hasPermission = item.querySelector(".role-permission-toggle").checked;

      if (hasPermission) {
        permissions.push({
          roleId: roleId,
          permission: "VIEW",
        });
      }
    });

    await updateChannelPermissions(selectedChannelForDeletion.id, permissions);
    hideModal(channelPermissionsModal);
  });

  // Save member roles button
  document.getElementById("save-member-roles").addEventListener("click", async () => {
    if (!selectedMemberForRoles) return;

    const roleIds = [];
    document.querySelectorAll("#member-roles-list .role-toggle-item").forEach((item) => {
      const roleId = item.dataset.roleId;
      const hasRole = item.querySelector(".member-role-toggle").checked;

      if (hasRole) {
        roleIds.push(roleId);
      }
    });

    await updateUserRoles(selectedMemberForRoles.id, roleIds);
    hideModal(memberRolesModal);
  });

  // Close modals
  document.querySelectorAll(".close-modal, .cancel-btn").forEach((el) => {
    el.addEventListener("click", () => {
      hideModal(channelModal);
      hideModal(deleteChannelModal);
      hideModal(channelPermissionsModal);
      hideModal(serverSettingsModal);
      hideModal(roleModal);
      hideModal(memberRolesModal);
    });
  });

  // Context menu item handlers
  document.querySelectorAll("#channel-context-menu .context-menu-item").forEach((item, index) => {
    item.addEventListener("click", () => {
      hideAllContextMenus();

      if (!selectedChannelForDeletion) return;

      // Handle different actions based on index
      switch (index) {
        case 0: // Mark as Read
          // Implementation for mark as read
          break;
        case 1: // Edit Channel
          // Implementation for edit channel
          break;
        case 2: // Mute Channel
          // Implementation for mute channel
          break;
        case 3: // Channel Permissions
          renderChannelPermissions(selectedChannelForDeletion);
          showModal(channelPermissionsModal);
          break;
        case 4: // Delete Channel
          document.getElementById("delete-channel-name").textContent = `#${selectedChannelForDeletion.name}`;
          showModal(deleteChannelModal);
          break;
      }
    });
  });

  // Member context menu handlers
  document.querySelectorAll("#member-context-menu .context-menu-item").forEach((item, index) => {
    item.addEventListener("click", () => {
      hideAllContextMenus();

      if (!selectedMemberForRoles) return;

      // Handle different actions based on index
      switch (index) {
        case 0: // View Profile
          // Implementation for view profile
          break;
        case 1: // Message
          // Implementation for message
          break;
        case 2: // Change Nickname
          // Implementation for change nickname
          break;
        case 3: // Manage Roles
          renderMemberRoles(selectedMemberForRoles);
          showModal(memberRolesModal);
          break;
        case 4: // Kick Member
          // Implementation for kick member
          break;
      }
    });
  });

  // Confirm delete channel
  document.getElementById("confirm-delete-channel").addEventListener("click", async () => {
    if (selectedChannelForDeletion) {
      await deleteChannel(selectedChannelForDeletion.id);
      hideModal(deleteChannelModal);
      selectedChannelForDeletion = null;
    }
  });

  // Close context menus when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideAllContextMenus();
      hideModal(channelModal);
      hideModal(deleteChannelModal);
      hideModal(channelPermissionsModal);
      hideModal(serverSettingsModal);
      hideModal(roleModal);
      hideModal(memberRolesModal);
    }
  });
}

// Render members in the server settings
function renderMembersSettings() {
  const membersList = document.getElementById("members-list-settings");
  if (!membersList) return;

  membersList.innerHTML = "";

  users.forEach((user) => {
    const memberElement = document.createElement("div");
    memberElement.className = "member-item";
    memberElement.dataset.userId = user.id;

    // Get user's roles
    const userRoles = user.roles || [];

    // Find the highest role for display
    let highestRole = null;
    if (userRoles.length > 0) {
      // Sort roles by position (higher position = more important)
      const userRoleObjects = roles.filter((role) => userRoles.includes(role.id));
      if (userRoleObjects.length > 0) {
        userRoleObjects.sort((a, b) => b.position - a.position);
        highestRole = userRoleObjects[0];
      }
    }

    let roleSpan = "";
    if (user.isAdmin) {
      roleSpan = `<span class="member-role admin">Admin</span>`;
    } else if (highestRole) {
      const roleColor = highestRole.color || "#5865f2";
      roleSpan = `<span class="member-role" style="background-color: ${roleColor}">${highestRole.name}</span>`;
    }

    memberElement.innerHTML = `
      <div class="member-avatar">
        <img src="${user.avatar || "https://via.placeholder.com/32"}" alt="${user.username}">
        <span class="member-status ${user.status || "offline"}"></span>
      </div>
      <div class="member-name">${user.username}</div>
      ${roleSpan}
      <div class="member-actions">
        <button class="manage-roles-btn" title="Manage Roles">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="none" d="M0 0h24v24H0z"/><path d="M5 4h14a1 1 0 0 1 1 1v4h-2V6H6v3L3 5l3-4v3zm14 16H5a1 1 0 0 1-1-1v-4h2v3h12v-3l3 4-3 4v-3z" fill="currentColor"/></svg>
        </button>
      </div>
    `;

    membersList.appendChild(memberElement);

    // Add event listener for manage roles button
    const manageRolesBtn = memberElement.querySelector(".manage-roles-btn");
    manageRolesBtn.addEventListener("click", () => {
      selectedMemberForRoles = user;
      renderMemberRoles(user);
      showModal(memberRolesModal);
    });
  });
}

// Connect to WebSocket server
function connectWebSocket() {
  // In a real application, replace this with your actual WebSocket server URL
  const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//chat.aa-bot.com/api/ws`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");

      // Send authentication message
      if (currentUser) {
        socket.send(
          JSON.stringify({
            type: "auth",
            token: localStorage.getItem("token"),
          })
        );
      }
    };

    socket.onmessage = handleWebSocketMessage;

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      // Attempt to reconnect after a delay
      setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  } catch (error) {
    console.error("Failed to connect to WebSocket:", error);
    // Attempt to reconnect after a delay
    setTimeout(connectWebSocket, 3000);
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "message":
        // Only add message if it's for the current channel
        if (currentChannel && data.data.channelId === currentChannel.id) {
          addMessageToUI(data.data);
        }
        break;

      case "user_status":
        updateUserStatus(data.userId, data.status);
        break;

      case "channel_created":
        // Add new channel if it doesn't exist
        if (!channels.some((c) => c.id === data.channel.id)) {
          channels.push(data.channel);
          renderChannels();
        }
        break;

      case "channel_deleted":
        // Remove channel if it exists
        const channelIndex = channels.findIndex((c) => c.id === data.channelId);
        if (channelIndex !== -1) {
          channels.splice(channelIndex, 1);
          renderChannels();

          // If current channel was deleted, switch to first available channel
          if (currentChannel && currentChannel.id === data.channelId) {
            if (channels.length > 0) {
              switchChannel(channels[0]);
            } else {
              currentChannel = null;
            }
          }
        }
        break;

      case "role_created":
        // Add new role if it doesn't exist
        if (!roles.some((r) => r.id === data.role.id)) {
          roles.push(data.role);
          renderRoles();
        }
        break;

      case "role_updated":
        // Update role if it exists
        const roleIndex = roles.findIndex((r) => r.id === data.role.id);
        if (roleIndex !== -1) {
          roles[roleIndex] = data.role;
          renderRoles();
        }
        break;

      case "role_deleted":
        // Remove role if it exists
        const roleDeleteIndex = roles.findIndex((r) => r.id === data.roleId);
        if (roleDeleteIndex !== -1) {
          roles.splice(roleDeleteIndex, 1);
          renderRoles();
        }
        break;

      case "user_roles_updated":
        // Update user roles
        const userIndex = users.findIndex((u) => u.id === data.userId);
        if (userIndex !== -1) {
          users[userIndex].roles = data.roleIds;
          renderMembers();
        }
        break;
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
}

// Update user status
function updateUserStatus(userId, status) {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.status = status;
    renderMembers();

    // Update current user status if it's the same user
    if (currentUser && currentUser.id === userId) {
      currentUser.status = status;
      updateUserInfo(currentUser);
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
