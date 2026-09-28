# Generated data migration to seed FEEDBACK_VIEW and FEEDBACK_GIVE permissions

from django.db import migrations


def seed_feedback_permissions(apps, schema_editor):
    RolePermission = apps.get_model('accounts', 'RolePermission')

    entries = [
        ('SUPER_ADMIN', 'FEEDBACK_VIEW', 'Access and inspect continuous feedback stream'),
        ('SUPER_ADMIN', 'FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
        ('HR', 'FEEDBACK_VIEW', 'Access organization-wide continuous feedback stream'),
        ('HR', 'FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
        ('MANAGER', 'FEEDBACK_VIEW', 'Access continuous feedback for team and peers'),
        ('MANAGER', 'FEEDBACK_GIVE', 'Give, draft, and publish continuous performance feedback'),
        ('INTERN', 'FEEDBACK_VIEW', 'View continuous feedback received and given'),
    ]

    for role, code, desc in entries:
        RolePermission.objects.update_or_create(
            role=role,
            permission_code=code,
            defaults={'description': desc}
        )


def unseed_feedback_permissions(apps, schema_editor):
    RolePermission = apps.get_model('accounts', 'RolePermission')
    RolePermission.objects.filter(permission_code__in=['FEEDBACK_VIEW', 'FEEDBACK_GIVE']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_rolepermission'),
    ]

    operations = [
        migrations.RunPython(seed_feedback_permissions, unseed_feedback_permissions),
    ]
