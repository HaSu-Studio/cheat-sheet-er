import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Solid icons - import only the icons you need
import {
  faPlus,
  faPen,
  faTrash,
  faSearch,
  faUser,
  faSignOutAlt,
  faSignInAlt,
  faUserPlus,
  faArrowLeft,
  faArrowUp,
  faArrowDown,
  faCopy,
  faTimes,
  faTag,
  faFile,
  faFileAlt,
  faClock,
  faLock,
  faSliders,
  faCheck,
  faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons'

// Regular icons
import {
  faBookmark as farBookmark,
} from '@fortawesome/free-regular-svg-icons'

// Brands icons
import {
  faGithub,
  faGoogle,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons'

// Add icons to the library
// Solid icons
library.add(
  faPlus,
  faPen,
  faTrash,
  faSearch,
  faUser,
  faSignOutAlt,
  faSignInAlt,
  faUserPlus,
  faArrowLeft,
  faArrowUp,
  faArrowDown,
  faCopy,
  faTimes,
  faTag,
  faFile,
  faFileAlt,
  faClock,
  faLock,
  faSliders,
  faCheck,
  faEllipsisVertical,
)

// Regular icons
library.add(
  farBookmark,
)

// Brand icons
library.add(
  faGithub,
  faGoogle,
  faTwitter,
)

export { FontAwesomeIcon }
