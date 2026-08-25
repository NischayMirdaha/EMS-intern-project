
EduVerse360/
│
├── App/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── EduVerse360App.swift
│   ├── AppRouter.swift
│   ├── DependencyContainer.swift
│   ├── AppEnvironment.swift
│   └── AppConfiguration.swift
│
├── Core/
│   │
│   ├── Network/
│   │   ├── APIClient.swift
│   │   ├── APIEndpoint.swift
│   │   ├── RequestBuilder.swift
│   │   ├── HTTPMethod.swift
│   │   ├── NetworkError.swift
│   │   ├── AuthInterceptor.swift
│   │   ├── TokenManager.swift
│   │   └── NetworkLogger.swift
│   │
│   ├── Database/
│   │   ├── CoreData/
│   │   ├── Realm/
│   │   └── CacheManager.swift
│   │
│   ├── Security/
│   │   ├── KeychainManager.swift
│   │   ├── Encryption.swift
│   │   └── JWTDecoder.swift
│   │
│   ├── Storage/
│   │   ├── UserDefaultsManager.swift
│   │   ├── FileManagerService.swift
│   │   └── SecureStorage.swift
│   │
│   ├── Extensions/
│   │
│   ├── Utilities/
│   │
│   ├── Constants/
│   │
│   ├── Helpers/
│   │
│   ├── Managers/
│   │   ├── SessionManager.swift
│   │   ├── NotificationManager.swift
│   │   ├── PermissionManager.swift
│   │   └── LocationManager.swift
│   │
│   └── DI/
│       └── DependencyInjection.swift
│
├── Shared/
│   │
│   ├── Components/
│   │   ├── Buttons/
│   │   ├── TextFields/
│   │   ├── Cards/
│   │   ├── Charts/
│   │   ├── EmptyStates/
│   │   ├── LoadingViews/
│   │   ├── Alerts/
│   │   └── Navigation/
│   │
│   ├── Theme/
│   │   ├── Colors.swift
│   │   ├── Fonts.swift
│   │   ├── Icons.swift
│   │   ├── Shadows.swift
│   │   └── Spacing.swift
│   │
│   └── Resources/
│       ├── Assets.xcassets
│       ├── Fonts/
│       ├── Localization/
│       └── Images/
│
├── Domain/
│   │
│   ├── Models/
│   ├── Entities/
│   ├── RepositoryProtocols/
│   ├── UseCases/
│   └── DTO/
│
├── Data/
│   │
│   ├── Repositories/
│   ├── Remote/
│   ├── Local/
│   ├── Mappers/
│   └── Services/
│
├── Features/
│
│   ├── Authentication/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   ├── Models/
│   │   ├── Repository/
│   │   ├── Services/
│   │   ├── Components/
│   │   └── Navigation/
│   │
│   ├── Dashboard/
│   │
│   ├── SchoolAdministration/
│   │   ├── Admission/
│   │   ├── Classes/
│   │   ├── Sections/
│   │   ├── AcademicYear/
│   │   ├── Branches/
│   │   └── Staff/
│   │
│   ├── Student/
│   │   ├── Profile/
│   │   ├── Health/
│   │   ├── Documents/
│   │   ├── Discipline/
│   │   └── Alumni/
│   │
│   ├── Attendance/
│   │   ├── StudentAttendance/
│   │   ├── TeacherAttendance/
│   │   ├── StaffAttendance/
│   │   ├── QRAttendance/
│   │   ├── RFID/
│   │   └── FaceRecognition/
│   │
│   ├── LMS/
│   │   ├── Courses/
│   │   ├── Assignments/
│   │   ├── Homework/
│   │   ├── VideoLessons/
│   │   ├── Library/
│   │   ├── Discussion/
│   │   └── QuestionBank/
│   │
│   ├── Examination/
│   │   ├── Planning/
│   │   ├── OnlineExam/
│   │   ├── OMR/
│   │   ├── Results/
│   │   ├── ReportCards/
│   │   └── Transcript/
│   │
│   ├── Finance/
│   │   ├── Fee/
│   │   ├── Salary/
│   │   ├── Expenses/
│   │   ├── Reports/
│   │   ├── Khalti/
│   │   └── Esewa/
│   │
│   ├── Parent/
│   │
│   ├── Teacher/
│   │
│   ├── AIAnalytics/
│   │   ├── Prediction/
│   │   ├── Recommendation/
│   │   ├── AttendanceRisk/
│   │   └── Dashboard/
│   │
│   ├── CRM/
│   │
│   ├── Transportation/
│   │   ├── GPS/
│   │   ├── Routes/
│   │   ├── Drivers/
│   │   └── Tracking/
│   │
│   ├── Hostel/
│   │
│   ├── Inventory/
│   │
│   ├── Communication/
│   │   ├── SMS/
│   │   ├── Email/
│   │   ├── PushNotification/
│   │   └── Chat/
│   │
│   ├── ChatBot/
│   │
│   ├── Settings/
│   │
│   └── Profile/
│
├── Tests/
│   ├── UnitTests/
│   └── UITests/
│
└── SupportingFiles/
    ├── Info.plist
    ├── LaunchScreen.storyboard
    └── GoogleService-Info.plist



example: 

Attendance/
│
├── Views/
│   ├── AttendanceView.swift
│   ├── AttendanceRow.swift
│   └── AttendanceDetail.swift
│
├── ViewModels/
│   ├── AttendanceViewModel.swift
│
├── Models/
│   ├── Attendance.swift
│
├── Repository/
│   ├── AttendanceRepository.swift
│   ├── AttendanceRepositoryImpl.swift
│
├── Services/
│   ├── AttendanceAPI.swift
│
├── Components/
│   ├── AttendanceCard.swift
│
└── Navigation/
    └── AttendanceRouter.swift
    
    
    
    Authentication flow:
    
    Splash

↓

Check Token

↓

Token Valid ?

↓

YES → Dashboard

NO → Login

↓

Login API

↓

Access Token

↓

Save in Keychain

↓

Dashboard
