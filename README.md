# CampusVotex – Public Complaint & Voting System

CampusVotex is a smart college complaint platform where students can report campus problems, vote for priority, and staff can update progress until resolved.

## Key Features
- **3D Entry Experience** with animated cube intro.
- **Account Login** using college register number + password.
- **Role-Based Access**:
  - **Students**: post issues, vote, rate solved issues.
  - **Teachers/Staff**: cannot vote, can update issue status.
- **Issue Posting Fields**: title, class/location, short description.
- **AI-Style Similar Issue Merge**: similar complaints merge automatically and increase seriousness.
- **Priority Stats**: top voted issue, open issue count, high-priority alert count.
- **Staff Alerting**: unresolved issues with high votes show alarm for staff.
- **Solved Status + Rating** section for feedback after closure.
- **About Section** included on homepage.
- **Liquid Glass UI** aesthetic with modern gradients.

## Demo Login Accounts
- Student: `23CSE104 / student123`
- Staff: `STAFF1001 / staff123`

## Run
1. Open `index.html` directly, or
2. Serve with: `python3 -m http.server 4173`

Then open: `http://127.0.0.1:4173`

## Notes
- This is a frontend prototype using browser `localStorage`.
- Replace demo credentials with secure backend authentication for production.
