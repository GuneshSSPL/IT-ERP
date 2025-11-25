# IT ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for IT software development companies (50-100 employees). This system provides complete project management, resource allocation, task tracking, asset management, inventory, time tracking, client management, and comprehensive analytics.

## Features

- **Employee Management**: Complete employee hierarchy, skills tracking, and department management
- **Project Management**: Project assignment, status tracking, phases, and milestones
- **Task Management**: Task assignment, status updates, priority tracking
- **Time Tracking**: Employee time entries with billable/non-billable hours
- **Client Management**: Client companies, contacts, and account management
- **Asset Management**: IT assets (hardware/software) tracking and assignment
- **Inventory Management**: Inventory tracking with reorder points
- **Leave Management**: Employee leave requests and approvals
- **Skills Management**: Employee skills and project skill requirements
- **RBAC**: Role-Based Access Control with permissions
- **Analytics Dashboard**: Comprehensive metrics and reporting

## Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Database**: Microsoft SQL Server (MSSQL)
- **Authentication**: JWT
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

## Quick Start with Docker

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Create environment file** (optional, defaults are set in docker-compose.yml):
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**:
   - The database will be initialized automatically on first server start
   - Database tables and default admin user will be created automatically
   - Default admin credentials:
     - **Email**: admin@iterp.com
     - **Password**: admin123
     - **Employee ID**: EMP001

   - **Seed Data**: Realistic demo data is automatically added:
     - 7 users (2 admins, 3 managers, 3 employees) with Indian names
     - 6 clients from various industries
     - 12 projects in different stages
     - 30+ tasks, time entries, assets, and more
     - All seeded users password: `password123`
     - See `SEED_DATA.md` for complete details

5. **Access the application**:
   - Frontend: http://localhost:3000
   - MSSQL: localhost:1433
   - Login with the default admin credentials above

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migrations**:
   - Ensure MSSQL is running
   - Execute `lib/db/schema.sql` in your MSSQL database

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - http://localhost:3000

## Database Configuration

Default development credentials:
- **Username**: sa
- **Password**: sipamara
- **Database**: ITERP
- **Host**: 127.0.0.1 (local) or mssql (Docker)
- **Port**: 1433

## Project Structure

```
docker-demo/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── db/               # Database connection & schema
│   └── auth/             # JWT utilities
├── docker/               # Docker configuration
│   └── mssql/           # MSSQL initialization scripts
├── docker-compose.yml    # Docker Compose configuration
└── Dockerfile            # Next.js container definition
```

## Default Roles

The system comes with three default roles:
- **admin**: System Administrator with full access
- **manager**: Project Manager with team management access
- **employee**: Regular Employee with standard access

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (requires auth)

### More endpoints coming soon...

## Development

### Building for Production

```bash
npm run build
```

### Running Production Build

```bash
npm start
```

## Docker Commands

- **Start services**: `docker-compose up -d`
- **Stop services**: `docker-compose down`
- **View logs**: `docker-compose logs -f`
- **Rebuild**: `docker-compose up -d --build`
- **Remove volumes**: `docker-compose down -v`

## Security Notes

⚠️ **Important**: Change the default JWT_SECRET and database passwords before deploying to production!

## License

This project is proprietary software for internal use.

## Support

For issues or questions, please contact the development team.

