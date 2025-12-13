# IssueHive — Community-Driven Issue Tracking & Collaboration Platform

A modern, full-featured web application where users can report, track, and collaborate on issues with a vibrant community. Built with React, TypeScript, and Firebase for real-time updates and seamless collaboration.

## ✨ Core Features

### Issue Management
- **Create Issues**: Submit issues with title, description, category, priority, and optional attachments
- **Real-time Tracking**: Track issue status through Received → In Progress → Resolved workflow
- **Visibility Control**: Set issues as Public, Private, or Draft with granular privacy controls
- **Issue Analytics**: View detailed engagement metrics for each issue
- **Comments & Discussion**: Add comments and media to issues for collaborative problem-solving
- **Engagement Tracking**: Upvotes, downvotes, supports, and comment counts

### User Profiles & Social Features
- **User Profiles**: Comprehensive public profiles with statistics and activity tracking
  - Display user information, bio, location, and social media links
  - View follower/following counts
  - See user's created issues and contributions
- **Social Media Integration**: Users can link their GitHub, Twitter, LinkedIn, Instagram, and personal website
  - Colored, clickable social icons on profiles and dashboard
  - Beautiful gradient designs for each platform
  - Hover tooltips showing platform names
- **Follow System**: Follow other users to stay updated on their contributions
- **Messaging System**: Send and receive text messages directly to other users
  - Message history in Messages tab on profile
  - Display sender information with timestamps
  - Reply functionality for direct communication

### Analytics & Activity (Combined View)
- **User Analytics Dashboard**: 
  - Total issues created and resolved
  - Engagement metrics (upvotes, downvotes, comments, supports)
  - Visual analytics cards with real-time data
  - Responsive grid layout with color-coded metrics
- **Activity Feed**: 
  - Track all user interactions (comments, votes, issue creation)
  - See recent activity with timestamps
  - Top 15 recent activities displayed
  - Activity summary showing followers, following, and total issues
- **Combined Tab**: Analytics and Activity merged into single comprehensive view for better UX

### Dashboard
- **Welcome Section**: Personalized greeting with visual hierarchy
- **Issue Management**: Quick access to create, browse, and manage issues
- **Statistics Cards**: Visual overview of user's contribution metrics
- **Social Icons**: Clickable colored social media links with hover effects
- **Recent Issues**: See latest issues with status and engagement info

### Authentication & Authorization
- **Multiple Auth Methods**: 
  - Email/Password authentication
  - Google OAuth integration
  - Google login indicators showing authentication method
- **User Sessions**: Secure session management with Firebase Auth
- **Role-Based Access**: Owner-only features like analytics, activity feed, and messages
- **Profile Customization**: Edit display name, username, bio, location, and social links

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** + **TypeScript 5.5.3**: Type-safe, modern UI development
- **Vite 5.4.1**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first styling with custom glassmorphism effects
- **shadcn-style Components**: Pre-built, accessible UI components
- **React Router**: Client-side routing with clean page structure
- **React Query**: Advanced client-side caching with optimized configuration
- **Framer Motion**: Smooth scroll animations and page transitions
- **Lucide Icons**: Beautiful, customizable icon library
- **Sonner**: Toast notifications for user feedback

### Backend & Data
- **Firebase Suite**:
  - **Authentication**: Email/password and Google OAuth with verified domains
  - **Firestore**: Real-time NoSQL database with security rules
  - **Cloud Storage**: File uploads for issue attachments and profile pictures
  - **Real-time Updates**: WebSocket-based data synchronization

### Code Organization
```
src/
├── pages/              # Route-level components
│   ├── Index.tsx      # Landing page with animations
│   ├── Auth.tsx       # Authentication page
│   ├── Dashboard.tsx  # User dashboard with stats & social icons
│   ├── Issues.tsx     # Issues feed with filtering & engagement
│   ├── RaiseIssue.tsx # Create new issue form
│   ├── EditProfile.tsx # Profile customization with social links
│   ├── UserProfile.tsx # Public profile with messages & analytics
│   └── NotFound.tsx   # 404 page
├── components/
│   ├── ui/            # shadcn-style components (button, card, dialog, etc.)
│   ├── Navbar.tsx     # Navigation with active page underlines
│   ├── SendMessageDialog.tsx # Message composition
│   ├── IssueCard.tsx  # Issue display cards
│   └── ...            # Other components
├── hooks/
│   ├── use-auth.ts             # Authentication state
│   ├── use-issues-firebase.ts  # Issues CRUD operations
│   ├── use-messaging.ts        # Message operations & received messages
│   ├── use-user-profile.ts     # User profile data
│   ├── use-user-activity.ts    # User activity tracking
│   └── ...            # Other custom hooks
├── integrations/
│   └── firebase/      # Firebase configuration and utilities
├── lib/
│   ├── utils.ts       # Helper utilities (cn, sanitization)
│   └── storage.ts     # Local storage utilities
└── types/
    └── issue.ts       # TypeScript interfaces
```

## 📱 UI/UX Enhancements

### Design System
- **Glassmorphism**: Modern frosted glass effect for cards and overlays
- **Gradient Backgrounds**: Beautiful orange-to-amber gradients for CTAs
- **Responsive Layout**: Mobile-first design with adaptive breakpoints
- **Color-Coded Sections**: 
  - Orange for primary actions and issue creation
  - Blue for authentication and user info
  - Green for positive actions (upvotes)
  - Red for negative actions (downvotes)
  - Purple for analytics and advanced features
- **Smooth Transitions**: Hover effects and animations throughout

### Key UI Components
- **Sticky Navigation**: Always-accessible navbar with active page underlines (removed About link)
- **Tab Navigation**: Organized content across multiple sections (Issues, Messages, Analytics & Activity, Settings)
- **Modal Dialogs**: Clean, non-intrusive forms and confirmations
- **Status Badges**: Visual indicators for issue status (Open, In Progress, Resolved)
- **Progress Indicators**: Loading skeletons and spinners for better UX
- **Colored Social Icons**: Platform-specific icons with gradient backgrounds
- **Message Cards**: Beautiful cards displaying sender info, message content, and timestamps

## 🔐 Security & Performance

### Security Features
- **Content Security Policy**: Prevent XSS attacks
- **Input Sanitization**: Sanitize all user input
- **Firebase Security Rules**: Owner-only updates and deletes
- **Environment Validation**: Strict typing for configuration
- **Safe External Links**: `noopener noreferrer` on all external links
- **Secure Authentication**: Google OAuth with verified domains
- **Protected Routes**: Owner-only access to messages and settings

### Performance Optimizations
- **Code Splitting**: Lazy-load route components
- **React Query Caching**: 5-minute stale time, 10-minute garbage collection
- **Manual Chunk Splitting**: Optimize bundle size and caching strategy
- **Efficient Polling**: 5-second polling for messages and activity
- **Avatar Optimization**: Fallback avatars with initials
- **Bundle Size**: ~312KB main bundle (gzipped: ~90KB)

### PWA Features
- **Offline Support**: Service worker for offline access
- **App Manifest**: Installable as native app
- **Mobile Optimized**: Touch-friendly interface
- **Response Caching**: Efficient asset caching

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Firebase project with Web SDK configured

### Installation

1. **Clone and install**:
```bash
git clone https://github.com/dhirendraxd/Issue-Hive.git
cd Issue-Hive
npm install
```

2. **Setup Firebase** (recommended):
   - Create a Firebase project: https://firebase.google.com
   - Enable Authentication (Email/Password + Google OAuth)
   - Add authorized domains in Authentication settings:
     - `localhost`
     - `127.0.0.1`
     - Your deployment domain
   - Enable Firestore Database
   - Enable Cloud Storage
   - Copy your Web SDK config

3. **Configure environment**:
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

4. **Run development server**:
```bash
npm run dev
```
Open http://localhost:8080

### Available Scripts
- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production (~5 seconds)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 📖 Usage Guide

### For First-Time Users
1. Visit the app and click "Sign Up"
2. Use email/password or Google OAuth to create account
3. Complete your profile with bio, location, and social links
4. Browse existing issues or create your first one

### Creating an Issue
1. Click "Raise Issue" in navigation
2. Fill in title, description, category, and priority
3. Optional: Add attachment URL or upload image
4. Set visibility (Public/Private/Draft)
5. Click "Create Issue"

### Engaging with Issues
- **Upvote**: Click upvote button to support an issue
- **Downvote**: Indicate issue isn't a priority
- **Comment**: Add discussion and provide solutions
- **Support**: Click support button to show backing

### Managing Your Profile
1. Go to Dashboard
2. Click "Edit Profile"
3. Update:
   - Profile picture (upload or choose avatar style)
   - Display name and username
   - Bio and location
   - Social media links (GitHub, Twitter, LinkedIn, Instagram, Website)
4. Changes auto-save

### Viewing Messages
1. Go to your profile Dashboard
2. Click "Messages" tab
3. See all messages from other users with:
   - Sender's avatar and name
   - Message timestamp
   - Full message content
   - Option to view sender's profile or reply

### Sending Messages
1. Visit another user's profile
2. Click "Send Message" button
3. Compose your message in the dialog
4. Message appears in their Messages tab

## 🎯 Project Highlights

### Latest Enhancements (Current Session)
- ✅ **Merged Analytics & Activity**: Single comprehensive tab combining analytics metrics with activity feed
- ✅ **Colored Social Icons**: Platform-specific gradient colors (Orange for Website, Slate for GitHub, Blue for Twitter, Indigo for LinkedIn, Pink for Instagram)
- ✅ **Icon-Only Social Display**: Removed text labels, added hover tooltips for platform names
- ✅ **Messages Tab**: Full messaging system with sender profiles and timestamps
- ✅ **Edit Profile Redesign**: Modern layout with sticky header, color-coded sections, and glassmorphic cards
- ✅ **Google Login Indicators**: Clear badges showing authentication method in header and email section
- ✅ **Dashboard Redesign**: Better visual hierarchy with improved spacing and stat cards
- ✅ **Fixed DOM Error**: Proper React unmounting in global error handlers
- ✅ **Social Media on Dashboard**: Clickable social icons matching user's configured links

### Technical Accomplishments
- **Zero TypeScript Errors**: Clean, type-safe codebase
- **Consistent Build Times**: 4-8 seconds for production builds
- **Mobile-First Design**: Fully responsive across all devices
- **Accessibility**: Semantic HTML and ARIA labels throughout
- **Real-time Features**: Firebase integration with Firestore and Storage

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes with clear messages
4. Submit a pull request with detailed description

## 📝 License

This project is open source. Feel free to use and modify as needed.

## 🙋 Support

For issues or questions:
- Open a GitHub issue with detailed description
- Check existing documentation and code comments
- Review the comprehensive README for setup guidance

---

**Built with ❤️ by the Issue-Hive team** | Last updated: December 12, 2025
