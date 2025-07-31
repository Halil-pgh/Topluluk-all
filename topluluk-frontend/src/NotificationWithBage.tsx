import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface NotificationIconWithBadgeProp {
    notificationCount: number
}

const NotificationIconWithBadge = ({ notificationCount }: NotificationIconWithBadgeProp) => {
  return (
    <Badge 
      badgeContent={notificationCount} 
      color="error"
      max={99}
    >
      <NotificationsIcon />
    </Badge>
  );
};

export default NotificationIconWithBadge;