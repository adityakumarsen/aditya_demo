from typing import Dict, List, Tuple
from django.db import transaction
from apps.accounts.models import RolePermission, UserRole

DEFAULT_ROLE_PERMISSIONS: Dict[str, List[Tuple[str, str]]] = {
    UserRole.SUPER_ADMIN: [
        ('ALL', 'Full Administrative System Control & Overrides'),
        ('SYSTEM_AUDIT', 'Access and inspect system-wide audit logs'),
        ('ROLE_MANAGE', 'Assign and update user security roles'),
        ('PERMISSION_MANAGE', 'Configure role permission matrices'),
        ('USER_MANAGE', 'Manage employee and user accounts'),
        ('CYCLE_MANAGE', 'Create and configure performance cycles'),
        ('CRITERIA_MANAGE', 'Configure appraisal categories and rubrics'),
        ('REPORT_VIEW_ALL', 'View comprehensive organization-wide analytics'),
        ('FEEDBACK_VIEW', 'Access and inspect continuous feedback stream'),
        ('FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
    ],
    UserRole.HR: [
        ('CYCLE_MANAGE', 'Manage appraisal cycles and timelines'),
        ('CRITERIA_MANAGE', 'Manage evaluation criteria and templates'),
        ('APPRAISAL_PUBLISH', 'Approve and publish final appraisal scores'),
        ('PIP_VIEW_ALL', 'Access organization-wide PIP records'),
        ('REPORT_VIEW_ALL', 'View department and company analytics'),
        ('KPI_LIBRARY_MANAGE', 'Manage organization KPI library'),
        ('APPRAISAL_VIEW_TEAM', 'View appraisals across organizational units'),
        ('FEEDBACK_VIEW', 'Access organization-wide continuous feedback stream'),
        ('FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
    ],
    UserRole.MANAGER: [
        ('GOAL_ASSIGN', 'Assign and calibrate team member goals and KRAs'),
        ('EVIDENCE_REVIEW', 'Review and approve milestone submissions'),
        ('APPRAISAL_EVALUATE', 'Conduct and score manager evaluations'),
        ('PIP_CREATE', 'Initiate performance improvement plans'),
        ('MEETING_MANAGE', 'Conduct and document 1-on-1 sync meetings'),
        ('APPRAISAL_VIEW_TEAM', 'View appraisals for direct reports'),
        ('FEEDBACK_VIEW', 'Access continuous feedback for team and peers'),
        ('FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
    ],
    UserRole.INTERN: [
        ('GOAL_VIEW_OWN', 'View assigned goals and progress metrics'),
        ('EVIDENCE_SUBMIT', 'Submit proof and evidence for milestones'),
        ('APPRAISAL_SELF_EVALUATE', 'Complete self-assessment forms'),
        ('ATTENDANCE_LOG', 'Log and view daily working attendance'),
        ('IDP_VIEW', 'View individual development plan milestones'),
        ('PIP_VIEW_OWN', 'View own performance improvement plan if active'),
        ('FEEDBACK_VIEW', 'View continuous feedback received and given'),
    ]
}

SYSTEM_PERMISSIONS_CATALOG = [
    {
        'code': 'ALL',
        'name': 'Super Admin Master Access',
        'category': 'System Administration',
        'description': 'Full unrestricted bypass across all system endpoints, actions, and entities.'
    },
    {
        'code': 'SYSTEM_AUDIT',
        'name': 'System Audit Logs',
        'category': 'System Administration',
        'description': 'View, inspect, and export immutable administrative audit trails.'
    },
    {
        'code': 'ROLE_MANAGE',
        'name': 'Role Management',
        'category': 'System Administration',
        'description': 'Reassign user roles and modify RBAC role associations.'
    },
    {
        'code': 'PERMISSION_MANAGE',
        'name': 'Permission Matrix Management',
        'category': 'System Administration',
        'description': 'Configure granular permissions assigned to each role group.'
    },
    {
        'code': 'USER_MANAGE',
        'name': 'User & Employee Directory',
        'category': 'System Administration',
        'description': 'Create, edit, lock/unlock employee and user accounts.'
    },
    {
        'code': 'CYCLE_MANAGE',
        'name': 'Performance Cycle Governance',
        'category': 'Cycles & Governance',
        'description': 'Create, activate, close, and configure appraisal cycle windows.'
    },
    {
        'code': 'CRITERIA_MANAGE',
        'name': 'Evaluation Rubrics & Criteria',
        'category': 'Cycles & Governance',
        'description': 'Define evaluation categories, weightings, and scoring policies.'
    },
    {
        'code': 'REPORT_VIEW_ALL',
        'name': 'Organization Strategic Analytics',
        'category': 'Cycles & Governance',
        'description': 'Access macro-level performance history, benchmarks, and executive dashboards.'
    },
    {
        'code': 'APPRAISAL_PUBLISH',
        'name': 'Appraisal Final Approval & Publish',
        'category': 'Appraisals & Reviews',
        'description': 'Sign off, approve ratings, and publish final appraisal scorecards.'
    },
    {
        'code': 'APPRAISAL_EVALUATE',
        'name': 'Manager Appraisal Evaluation',
        'category': 'Appraisals & Reviews',
        'description': 'Complete manager evaluation forms and rate employee competencies.'
    },
    {
        'code': 'APPRAISAL_SELF_EVALUATE',
        'name': 'Self Assessment Submission',
        'category': 'Appraisals & Reviews',
        'description': 'Fill out and submit personal self-assessments during active appraisal windows.'
    },
    {
        'code': 'APPRAISAL_VIEW_TEAM',
        'name': 'Team Appraisal Visibility',
        'category': 'Appraisals & Reviews',
        'description': 'Inspect appraisal progression and statuses for team members.'
    },
    {
        'code': 'GOAL_ASSIGN',
        'name': 'Goal & KRA Assignment',
        'category': 'Goals & Execution',
        'description': 'Create and assign performance goals, targets, and KRAs to team members.'
    },
    {
        'code': 'GOAL_VIEW_OWN',
        'name': 'Personal Goal Tracking',
        'category': 'Goals & Execution',
        'description': 'View assigned goals, key results, and progress trackers.'
    },
    {
        'code': 'EVIDENCE_REVIEW',
        'name': 'Milestone Evidence Review',
        'category': 'Goals & Execution',
        'description': 'Review, verify, and approve proof/evidence submitted for goal milestones.'
    },
    {
        'code': 'EVIDENCE_SUBMIT',
        'name': 'Milestone Evidence Submission',
        'category': 'Goals & Execution',
        'description': 'Upload artifacts, code links, and documents as evidence of milestone completion.'
    },
    {
        'code': 'KPI_LIBRARY_MANAGE',
        'name': 'Company KRA Library',
        'category': 'Goals & Execution',
        'description': 'Curate and manage standard goal and competency templates in the KRA library.'
    },
    {
        'code': 'PIP_CREATE',
        'name': 'PIP Initiation',
        'category': 'Coaching & Recovery',
        'description': 'Initiate performance improvement plans and set recovery checkpoints.'
    },
    {
        'code': 'PIP_VIEW_ALL',
        'name': 'Organization PIP Directory',
        'category': 'Coaching & Recovery',
        'description': 'View and audit all active and completed PIP recovery plans across the company.'
    },
    {
        'code': 'PIP_VIEW_OWN',
        'name': 'Personal PIP Recovery',
        'category': 'Coaching & Recovery',
        'description': 'View own PIP objectives and submit recovery check-ins.'
    },
    {
        'code': 'MEETING_MANAGE',
        'name': '1-on-1 Sync Meetings',
        'category': 'Coaching & Recovery',
        'description': 'Schedule, document discussion points, and manage action items for 1-on-1 syncs.'
    },
    {
        'code': 'IDP_VIEW',
        'name': 'Individual Development Plans',
        'category': 'Growth & Attendance',
        'description': 'Access career development pathways and skill milestone tracking.'
    },
    {
        'code': 'ATTENDANCE_LOG',
        'name': 'Attendance Logging',
        'category': 'Growth & Attendance',
        'description': 'Record and view daily clock-in/out and shift logs.'
    },
    {
        'code': 'FEEDBACK_VIEW',
        'name': 'Continuous Feedback Visibility',
        'category': 'Feedback & Recognition',
        'description': 'Access and view continuous feedback entries and team recognition threads.'
    },
    {
        'code': 'FEEDBACK_GIVE',
        'name': 'Give Continuous Feedback',
        'category': 'Feedback & Recognition',
        'description': 'Compose, draft, and publish continuous performance feedback for team members.'
    }
]

VALID_PERMISSION_CODES = {p['code'] for p in SYSTEM_PERMISSIONS_CATALOG}


class RolePermissionService:
    @staticmethod
    def ensure_default_permissions_seeded():
        """Ensure default permissions are seeded in the database if table is empty."""
        if not RolePermission.objects.exists():
            records = []
            for role, perms in DEFAULT_ROLE_PERMISSIONS.items():
                for code, desc in perms:
                    records.append(
                        RolePermission(role=role, permission_code=code, description=desc)
                    )
            RolePermission.objects.bulk_create(records, ignore_conflicts=True)

    @classmethod
    def get_matrix(cls) -> Dict[str, List[str]]:
        """Return a mapping of role -> list of permission codes from database."""
        cls.ensure_default_permissions_seeded()
        matrix = {role: [] for role, _ in UserRole.choices}
        for item in RolePermission.objects.all().order_by('role', 'permission_code'):
            if item.role in matrix:
                matrix[item.role].append(item.permission_code)
        return matrix

    @classmethod
    def get_permissions_for_role(cls, role: str) -> List[str]:
        """Return list of permission codes assigned to a specific role."""
        cls.ensure_default_permissions_seeded()
        return list(
            RolePermission.objects.filter(role=role).values_list('permission_code', flat=True)
        )

    @classmethod
    def get_effective_permissions_for_user(cls, user) -> List[str]:
        """Compute full set of permissions for a user based on role, superuser status, and DB records."""
        if not user or not user.is_authenticated:
            return []

        roles = [user.role]
        if user.role == UserRole.SUPER_ADMIN:
            roles.append('ADMIN')
        elif user.role == UserRole.INTERN:
            roles.append('EMPLOYEE')

        base_perms = [f"ROLE_{r}" for r in roles]

        db_perms = cls.get_permissions_for_role(user.role)
        effective = set(base_perms + db_perms)

        if user.role == UserRole.SUPER_ADMIN or getattr(user, 'is_superuser', False) or user.username == 'admin':
            effective.add('ALL')
            effective.add('FEEDBACK_VIEW')
            effective.add('FEEDBACK_GIVE')

        return sorted(list(effective))

    @classmethod
    @transaction.atomic
    def update_role_permissions(cls, role: str, permission_codes: List[str]) -> List[str]:
        """Update permissions for a specific role in the database."""
        if role not in dict(UserRole.choices):
            raise ValueError(f"Invalid role: {role}")

        # Filter out codes that are not recognized or empty
        cleaned_codes = [c.strip().upper() for c in permission_codes if c and c.strip()]

        # Delete existing permissions for role
        RolePermission.objects.filter(role=role).delete()

        catalog_map = {p['code']: p['description'] for p in SYSTEM_PERMISSIONS_CATALOG}
        records = [
            RolePermission(
                role=role,
                permission_code=code,
                description=catalog_map.get(code, f"Permission {code}")
            )
            for code in cleaned_codes
        ]
        RolePermission.objects.bulk_create(records, ignore_conflicts=True)

        return cls.get_permissions_for_role(role)

    @classmethod
    @transaction.atomic
    def reset_role_to_defaults(cls, role: str = None):
        """Reset one or all roles to default permissions."""
        if role:
            if role not in DEFAULT_ROLE_PERMISSIONS:
                raise ValueError(f"No defaults configured for role: {role}")
            RolePermission.objects.filter(role=role).delete()
            records = [
                RolePermission(role=role, permission_code=code, description=desc)
                for code, desc in DEFAULT_ROLE_PERMISSIONS[role]
            ]
            RolePermission.objects.bulk_create(records, ignore_conflicts=True)
        else:
            RolePermission.objects.all().delete()
            cls.ensure_default_permissions_seeded()
