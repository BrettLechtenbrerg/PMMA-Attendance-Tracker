# PMMA Attendance Tracker

A comprehensive, mobile-first martial arts attendance tracking system built with Next.js 14, Supabase, and TypeScript.

## 🥋 Features

### Core Functionality
- **QR Code Scanning**: Individual student and family QR codes for quick check-in
- **Real-time Attendance**: Instant attendance tracking with offline support
- **Student Management**: Complete CRUD operations with belt progression tracking
- **Family Management**: Parent-student linking with family QR codes
- **Parent Portal**: Read-only dashboard for parents to view attendance and progress
- **Attendance Dashboard**: Real-time monitoring for instructors and managers

### Advanced Features
- **PWA Support**: Offline-capable Progressive Web App
- **Role-based Security**: Owner, Manager, Instructor, and Parent access levels
- **Reporting System**: PDF and CSV export capabilities
- **Notification System**: Automated alerts for absences, birthdays, and promotions
- **Multi-device Support**: Responsive design optimized for phones, tablets, and desktops

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **PWA**: next-pwa with Workbox for offline functionality
- **QR Codes**: @zxing/library for scanning, qrcode for generation
- **Reports**: jsPDF for PDF generation
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Vercel with GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pmma-attendance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Database Setup**
   
   Run the SQL migrations in your Supabase dashboard:
   ```bash
   # Copy the contents of supabase/migrations/*.sql
   # and run them in your Supabase SQL editor
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 PWA Installation

The app can be installed as a PWA on mobile devices and desktops:

1. Visit the app in your browser
2. Look for the "Install" prompt or use the browser's install option
3. The app will be available on your home screen/desktop

## 🧪 Testing

### Unit Tests
```bash
npm run test                # Run tests
npm run test:ui            # Run with UI
npm run test:coverage      # Run with coverage
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run with Playwright UI
```

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── attendance/        # Attendance management
│   ├── dashboard/         # Main dashboard
│   ├── families/          # Family management
│   ├── portal/            # Parent portal
│   ├── scanner/           # QR code scanner
│   ├── settings/          # System settings
│   └── students/          # Student management
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   └── ...               # Feature-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication logic
│   ├── attendance.ts     # Attendance services
│   ├── families.ts       # Family management
│   ├── notifications.ts  # Notification system
│   ├── qr-codes.ts       # QR code generation/parsing
│   ├── reports.ts        # Reporting system
│   └── supabase.ts       # Supabase client
├── supabase/             # Database migrations and functions
│   ├── functions/        # Edge functions
│   └── migrations/       # SQL migrations
├── __tests__/            # Unit tests
├── e2e/                  # End-to-end tests
└── public/               # Static assets
```

## 🎨 Design System

### Colors (PMMA Branding)
- **Primary**: Black (#000000)
- **Secondary**: Gold (#FFD700)
- **Accent**: Cranberry Red (#DC143C)

### Typography
- **Font Family**: Arial, sans-serif
- **Responsive sizing** with Tailwind CSS classes

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **CSRF Protection**: Built into Next.js 14
- **Input Sanitization**: Zod validation on all forms
- **Secure Headers**: CSP, HSTS, and other security headers
- **Role-based Access**: Granular permissions by user role

## 📊 Database Schema

### Core Tables
- `users` - System users with roles
- `students` - Student information and progress
- `parents` - Parent accounts with family QR codes
- `parent_students` - Parent-student relationships
- `classes` - Class schedules and information
- `attendance` - Attendance records
- `notifications` - Notification logs

### Key Features
- **Automatic QR Generation**: Triggers for student and family QR codes
- **Audit Logging**: Automatic timestamps and change tracking
- **Data Integrity**: Foreign key constraints and unique indexes

## 🔔 Notification System

### Automated Notifications
- **Absence Alerts**: Students absent 3+ days
- **Birthday Reminders**: Automated birthday greetings
- **Promotion Candidates**: Weekly belt promotion eligibility
- **Class Reminders**: 24-hour class notifications

### Supported Channels
- **Email**: via SendGrid (configurable)
- **SMS**: via Twilio (configurable)

## 📈 Reporting

### Available Reports
- **Attendance Reports**: Student attendance with rates and trends
- **Class Reports**: Class-by-class attendance summaries
- **Promotion Reports**: Students eligible for belt advancement

### Export Formats
- **PDF**: Professional formatted reports
- **CSV**: Data for external analysis

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   Set all required environment variables in Vercel dashboard

3. **Deploy Edge Functions**
   ```bash
   # Edge functions are automatically deployed with the app
   ```

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Optional: Notification services
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

## 🔧 Configuration

### PWA Settings
- Modify `public/manifest.json` for app metadata
- Update `next.config.js` for PWA behavior

### Branding
- Update colors in `tailwind.config.ts`
- Replace logo URL in components
- Modify `public/manifest.json` for app name/description

### Database
- Migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/`

## 👥 User Roles

### Owner
- Full system access
- User management
- System configuration

### Manager
- Student and family management
- Attendance reporting
- Notification management

### Instructor
- Student attendance
- QR code scanning
- Basic reporting

### Parent
- Read-only portal access
- View own children's attendance
- Attendance history and streaks

## 🐛 Troubleshooting

### Common Issues

1. **QR Scanner Not Working**
   - Check camera permissions
   - Ensure HTTPS in production
   - Verify browser compatibility

2. **Offline Functionality**
   - Check service worker registration
   - Verify PWA manifest
   - Test offline queue sync

3. **Database Connection**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Review network connectivity

### Development Tools
```bash
npm run lint          # Code linting
npm run type-check    # TypeScript checking
npm run test          # Run tests
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

Built with ❤️ for PMMA Dojo