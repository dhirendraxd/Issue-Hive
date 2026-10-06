import { Icon, addCollection } from "@iconify/react";
import siteIcons from "@/icons/site-icons.json";
import logoIcons from "@/icons/logos-icons.json";

addCollection(siteIcons);
addCollection(logoIcons);

type IconProps = Omit<Parameters<typeof Icon>[0], "icon"> & {
  size?: number | string;
};

function createIcon(componentName: string, iconName: string) {
  const IconComponent = ({ size, width, height, ...props }: IconProps) => (
    <Icon
      icon={`tabler:${iconName}`}
      width={width ?? size}
      height={height ?? size}
      {...props}
    />
  );
  IconComponent.displayName = componentName;
  return IconComponent;
}

export const GoogleIcon = ({ size, width, height, ...props }: IconProps) => (
  <Icon
    icon="logos:google-icon"
    width={width ?? size}
    height={height ?? size}
    {...props}
  />
);

export const CursorClick = ({ size, width, height, ...props }: IconProps) => (
  <Icon icon="tabler:click" width={width ?? size} height={height ?? size} {...props} />
);

export const UserShield = ({ size, width, height, ...props }: IconProps) => (
  <Icon icon="tabler:user-shield" width={width ?? size} height={height ?? size} {...props} />
);

export const Send2 = ({ size, width, height, ...props }: IconProps) => (
  <Icon icon="tabler:send-2" width={width ?? size} height={height ?? size} {...props} />
);

export const ArrowNarrowRight = ({ size, width, height, ...props }: IconProps) => (
  <Icon icon="tabler:arrow-narrow-right" width={width ?? size} height={height ?? size} {...props} />
);

export const AlertCircle = createIcon("AlertCircle", "alert-circle");
export const AlertTriangle = createIcon("AlertTriangle", "alert-triangle");
export const ArrowLeft = createIcon("ArrowLeft", "arrow-left");
export const ArrowRight = createIcon("ArrowRight", "arrow-right");
export const Bell = createIcon("Bell", "bell");
export const BookOpen = createIcon("BookOpen", "book");
export const Bug = createIcon("Bug", "bug");
export const Building2 = createIcon("Building2", "building");
export const Calendar = createIcon("Calendar", "calendar");
export const CalendarClock = createIcon("CalendarClock", "calendar-clock");
export const CalendarDays = createIcon("CalendarDays", "calendar-week");
export const Check = createIcon("Check", "check");
export const CheckCircle = createIcon("CheckCircle", "circle-check");
export const CheckCircle2 = createIcon("CheckCircle2", "circle-check-filled");
export const ChevronDown = createIcon("ChevronDown", "chevron-down");
export const ChevronLeft = createIcon("ChevronLeft", "chevron-left");
export const ChevronRight = createIcon("ChevronRight", "chevron-right");
export const ChevronUp = createIcon("ChevronUp", "chevron-up");
export const Circle = createIcon("Circle", "circle");
export const Clock = createIcon("Clock", "clock");
export const Coffee = createIcon("Coffee", "coffee");
export const Compass = createIcon("Compass", "compass");
export const Dot = createIcon("Dot", "point");
export const Edit2 = createIcon("Edit2", "edit");
export const Eye = createIcon("Eye", "eye");
export const EyeOff = createIcon("EyeOff", "eye-off");
export const FileEdit = createIcon("FileEdit", "file-pencil");
export const FileText = createIcon("FileText", "file-text");
export const Filter = createIcon("Filter", "filter");
export const Flag = createIcon("Flag", "flag");
export const FlipHorizontal = createIcon("FlipHorizontal", "flip-horizontal");
export const FlipVertical = createIcon("FlipVertical", "flip-vertical");
export const Gamepad2 = createIcon("Gamepad2", "device-gamepad-2");
export const Globe = createIcon("Globe", "globe");
export const GraduationCap = createIcon("GraduationCap", "school");
export const GripVertical = createIcon("GripVertical", "grip-vertical");
export const Home = createIcon("Home", "home");
export const Image = createIcon("Image", "photo");
export const Inbox = createIcon("Inbox", "inbox");
export const Info = createIcon("Info", "info-circle");
export const Landmark = createIcon("Landmark", "building-bank");
export const Laptop = createIcon("Laptop", "device-laptop");
export const Lightbulb = createIcon("Lightbulb", "bulb");
export const Link2 = createIcon("Link2", "link");
export const ListFilter = createIcon("ListFilter", "list-details");
export const Loader2 = createIcon("Loader2", "loader-2");
export const Lock = createIcon("Lock", "lock");
export const LogIn = createIcon("LogIn", "login");
export const LogOut = createIcon("LogOut", "logout");
export const Mail = createIcon("Mail", "mail");
export const MailPlus = createIcon("MailPlus", "mail-plus");
export const MapPin = createIcon("MapPin", "map-pin");
export const Megaphone = createIcon("Megaphone", "speakerphone");
export const Menu = createIcon("Menu", "menu");
export const MessageCircle = createIcon("MessageCircle", "message-circle");
export const MessageSquare = createIcon("MessageSquare", "message");
export const MoreHorizontal = createIcon("MoreHorizontal", "dots");
export const MoreVertical = createIcon("MoreVertical", "dots-vertical");
export const Palette = createIcon("Palette", "palette");
export const PanelLeft = createIcon("PanelLeft", "layout-sidebar-left-collapse");
export const PartyPopper = createIcon("PartyPopper", "confetti");
export const Pin = createIcon("Pin", "pin");
export const Plus = createIcon("Plus", "plus");
export const RefreshCw = createIcon("RefreshCw", "refresh");
export const Reply = createIcon("Reply", "arrow-back-up");
export const RotateCcw = createIcon("RotateCcw", "rotate");
export const RotateCw = createIcon("RotateCw", "rotate-clockwise");
export const Route = createIcon("Route", "route");
export const Save = createIcon("Save", "device-floppy");
export const Search = createIcon("Search", "search");
export const Send = createIcon("Send", "send");
export const Settings = createIcon("Settings", "settings");
export const Shield = createIcon("Shield", "shield");
export const ShieldAlert = createIcon("ShieldAlert", "shield-exclamation");
export const ShieldCheck = createIcon("ShieldCheck", "shield-check");
export const ShieldOff = createIcon("ShieldOff", "shield-off");
export const Sliders = createIcon("Sliders", "adjustments");
export const Smartphone = createIcon("Smartphone", "device-mobile");
export const SortDesc = createIcon("SortDesc", "sort-descending");
export const Sparkles = createIcon("Sparkles", "sparkles");
export const Sun = createIcon("Sun", "sun");
export const Tag = createIcon("Tag", "tag");
export const ThumbsDown = createIcon("ThumbsDown", "thumb-down");
export const ThumbsUp = createIcon("ThumbsUp", "thumb-up");
export const Timer = createIcon("Timer", "clock-hour-3");
export const Trash2 = createIcon("Trash2", "trash");
export const TrendingDown = createIcon("TrendingDown", "trending-down");
export const TrendingUp = createIcon("TrendingUp", "trending-up");
export const TriangleAlert = createIcon("TriangleAlert", "alert-hexagon");
export const Upload = createIcon("Upload", "upload");
export const User = createIcon("User", "user");
export const Users = createIcon("Users", "users");
export const Wrench = createIcon("Wrench", "tool");
export const X = createIcon("X", "x");
export const Zap = createIcon("Zap", "bolt");
export const ZoomOut = createIcon("ZoomOut", "zoom-out");
