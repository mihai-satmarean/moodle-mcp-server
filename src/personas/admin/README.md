# Admin MCP Persona

## Responsibilities
Platform administration, system monitoring, user management, and platform-wide analytics.

## MCP Tools

### System Health & Monitoring
- `admin_monitor_system_health` - Real-time platform performance metrics
- `admin_get_platform_analytics` - Comprehensive usage and outcome reports
- `admin_audit_security_compliance` - Security scan and compliance check

### User Management
- `admin_manage_bulk_enrollments` - Automate user enrollment operations
- `admin_configure_course_settings` - Intelligent course setup recommendations
- `admin_manage_user_roles` - Role and permission management

### Resource Management
- `admin_optimize_resource_allocation` - Resource usage analysis and recommendations
- `admin_predict_capacity_needs` - Forecasting for enrollment growth
- `admin_manage_backup_recovery` - Automate backup and test recovery procedures

### Configuration & Integration
- `admin_track_configuration_changes` - Audit log of all admin modifications
- `admin_integrate_external_systems` - Manage third-party integrations

### Course Management (Admin level)
- `get_courses` - List all courses on platform
- `get_courses_by_field` - Filter courses by specific criteria
- `get_course_statistics` - Platform-wide course statistics

## Data Sources
- Moodle Admin API endpoints
- System logs and metrics
- User activity data
- Course enrollment data
- Platform configuration

## Implementation Files
```
admin/
  tools/
    systemHealth.ts
    userManagement.ts
    analytics.ts
    courseManagement.ts
  types.ts
  index.ts
```
