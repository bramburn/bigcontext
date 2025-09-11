<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Best Practices for React Desktop Applications with Radix UI, Tailwind CSS, and Modern Desktop Frameworks

## Architecture and Component Structure

### Component-Based Architecture Foundation

When building desktop applications with React, Radix UI, and Tailwind CSS, the foundation lies in establishing a robust component-based architecture. This approach breaks down your application into reusable, self-contained components that can be easily maintained and scaled across your desktop application.[^1_1][^1_2]

The recommended structure follows a modular design pattern where each component encapsulates specific functionality:

- **Presentation Components**: Focus solely on rendering UI elements and receiving data via props[^1_3]
- **Container Components**: Handle business logic, state management, and data fetching[^1_3]
- **Headless Components**: Provide logic and state management without prescribing specific UI representation[^1_4]


### Directory Structure and Organization

For desktop applications, organize your project with clear separation of concerns:[^1_5]

```
src/
├── components/
│   ├── ui/           # Radix UI + Tailwind components
│   ├── layout/       # Layout-specific components
│   ├── forms/        # Form components
│   └── common/       # Shared components
├── pages/            # Route-based pages
├── hooks/            # Custom React hooks
├── services/         # API and business logic
├── stores/           # State management
└── utils/            # Utility functions
```

This structure promotes maintainability and makes it easier for team members to locate and modify components.[^1_6]

## UI Design Patterns and Best Practices

### Leveraging Radix UI with Tailwind CSS

The combination of Radix UI and Tailwind CSS provides an optimal balance between accessibility and design flexibility. Radix UI handles the complex accessibility logic and behavior, while Tailwind CSS provides the styling layer.[^1_7][^1_8][^1_9]

Key advantages of this combination:

- **Accessibility-first**: Radix UI components are built with WAI-ARIA guidelines[^1_9]
- **Customization Freedom**: Unstyled Radix primitives allow complete design control[^1_8]
- **Performance**: Utility-first approach reduces CSS bundle size[^1_10]
- **Developer Experience**: Fast prototyping and consistent design tokens[^1_9]


### Desktop-Specific UI Patterns

Desktop applications require specific UI patterns that differ from web applications:[^1_11]

**Flexibility**: Users should be able to adjust columns, sidebars, detail panels, and display modes to suit their workflow[^1_11]

**Familiarity**: Maintain consistent visual language and control placement that users expect from desktop applications[^1_11]

**Expansive**: Make use of available screen real estate with multiple views, sidebars with outline views, and disclosure groups[^1_11]

**Precise**: Allow for high-density content with tight margins and spacing optimized for mouse/trackpad interaction[^1_11]

## Navigation and Routing Architecture

### Desktop Navigation Patterns

Desktop applications benefit from different navigation patterns compared to web applications:[^1_12][^1_13]

**Hierarchical Navigation**: Organize content in clear parent-child relationships with breadcrumb support for deep navigation[^1_12]

**Flat/Lateral Navigation**: For peer-level content that can be accessed in any order[^1_12]

**Combined Structures**: Use hierarchical structures for complex relationships and flat structures for top-level sections[^1_12]

### React Router Best Practices for Desktop Apps

When implementing routing in desktop applications:[^1_14][^1_6]

**Centralized Route Configuration**: Create a dedicated routes file to manage all application routes[^1_6]

```javascript
// routes.js
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Settings from './Settings';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/settings/*" element={<Settings />} />
  </Routes>
);
```

**Nested Routes**: Organize complex desktop interfaces with nested routing for different panels and views[^1_14][^1_6]

**Protected Routes**: Implement authentication-based route protection for sensitive desktop application features[^1_14]

**Dynamic Routing**: Use parameters for context-specific views like user profiles or document editing[^1_6]

## State Management Strategies

### Modern State Management Patterns

For desktop applications, state management becomes crucial due to complex user interactions and data relationships:[^1_15][^1_16]

**Local State**: Use React's built-in `useState` and `useReducer` for component-specific state[^1_15]

**Global State**: Implement centralized state management for data shared across multiple components[^1_15]

**Server State**: Use specialized tools like TanStack Query for managing server-synchronized data[^1_16]

**Context Providers**: Leverage React Context for theme, user preferences, and application-wide settings[^1_15]

### State Categorization

Organize your state into clear categories:[^1_15]

- **Data State**: Business logic and feature-specific data
- **UI State**: Interface controls and user interaction state
- **Session State**: User authentication and profile information
- **Communication State**: Loading states and API request status


## Desktop Framework Integration

### Electron vs Tauri Considerations

When choosing between Electron and Tauri for your React desktop application:[^1_17][^1_18]

**Electron Benefits**:

- Mature ecosystem with extensive documentation[^1_17]
- Large community and plugin availability[^1_17]
- Comprehensive desktop integration APIs[^1_17]

**Tauri Advantages**:

- Smaller bundle sizes (8.6MB vs 244MB)[^1_18]
- Better performance and memory efficiency[^1_18]
- Built-in security features and plugin system[^1_17]

**Framework-Agnostic Approach**: Design your React components to be framework-independent, allowing easy migration between Electron and Tauri[^1_17]

### Desktop-Specific Features

Implement desktop-specific functionality:

- **System Tray Integration**: For background operations and quick access[^1_19]
- **Native Menus**: File menus and context menus following OS conventions[^1_11]
- **Window Management**: Multi-window support with proper state synchronization[^1_12]
- **Deep Linking**: Handle protocol-based application launches[^1_20]


## Accessibility and Inclusive Design

### ARIA Implementation

Follow established ARIA patterns for complex desktop components:[^1_21][^1_22]

**Semantic HTML First**: Use native HTML elements before adding ARIA attributes[^1_22]

**Proper ARIA Roles**: Apply appropriate roles for custom components:

```javascript
// Accessible dropdown with Radix UI
<DropdownMenu.Root>
  <DropdownMenu.Trigger aria-haspopup="true">
    Options
  </DropdownMenu.Trigger>
  <DropdownMenu.Content role="menu">
    <DropdownMenu.Item role="menuitem">Edit</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

**Keyboard Navigation**: Ensure all interactive elements are keyboard accessible[^1_21]

**Screen Reader Support**: Test with screen readers and provide appropriate labels and descriptions[^1_22]

### Desktop Accessibility Considerations

Desktop applications have specific accessibility requirements:

- **High Contrast Support**: Implement theme switching for users with visual impairments
- **Keyboard Shortcuts**: Provide customizable keyboard shortcuts for power users
- **Zoom Support**: Ensure UI scales appropriately with system zoom settings
- **Focus Management**: Maintain clear focus indicators and logical tab order


## Performance and Optimization

### Component Optimization

Implement performance best practices for desktop applications:[^1_23]

**Lazy Loading**: Load components and routes on demand to reduce initial bundle size
**Memoization**: Use React.memo and useMemo for expensive calculations
**Virtual Lists**: Implement virtualization for large data sets
**Code Splitting**: Split code at route level and feature boundaries

### Bundle Optimization

Optimize your application bundle for desktop deployment:

- **Tree Shaking**: Eliminate unused Tailwind CSS classes and JavaScript code
- **Asset Optimization**: Compress images and fonts for faster loading
- **Caching Strategies**: Implement appropriate caching for static assets


## Testing and Quality Assurance

### Component Testing

Establish comprehensive testing for your React components:[^1_24]

**Unit Testing**: Test individual components with React Testing Library
**Integration Testing**: Test component interactions and state management
**End-to-End Testing**: Use Playwright for full application workflow testing
**Accessibility Testing**: Automated accessibility testing with tools like axe-core

### Desktop-Specific Testing

Test desktop-specific functionality:

- **Multi-Window Scenarios**: Test window state synchronization
- **System Integration**: Test file system access and native features
- **Cross-Platform Compatibility**: Ensure consistent behavior across operating systems

This comprehensive approach to building React desktop applications with Radix UI and Tailwind CSS provides a solid foundation for creating accessible, maintainable, and high-performance desktop software. The key is maintaining clear separation of concerns while leveraging the strengths of each technology in the stack.
<span style="display:none">[^1_100][^1_101][^1_102][^1_103][^1_104][^1_105][^1_106][^1_107][^1_108][^1_109][^1_110][^1_111][^1_112][^1_113][^1_114][^1_115][^1_116][^1_117][^1_118][^1_119][^1_120][^1_121][^1_122][^1_123][^1_124][^1_125][^1_126][^1_127][^1_128][^1_129][^1_130][^1_131][^1_132][^1_133][^1_134][^1_135][^1_136][^1_137][^1_138][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_40][^1_41][^1_42][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_50][^1_51][^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96][^1_97][^1_98][^1_99]</span>

<div style="text-align: center">⁂</div>

[^1_1]: https://nishangiri.dev/blog/styling-react-apps

[^1_2]: https://www.mendix.com/blog/what-is-component-based-architecture/

[^1_3]: https://www.angularminds.com/blog/react-architecture-patterns-in-reactjs-apps

[^1_4]: https://martinfowler.com/articles/headless-component.html

[^1_5]: https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/

[^1_6]: https://namastedev.com/blog/react-router-dom-best-practices/

[^1_7]: https://dev.to/swhabitation/tailwind-css-vs-radix-ui-which-one-should-you-choose-for-your-next-project-g4k

[^1_8]: https://www.dhiwise.com/post/how-to-streamline-web-development-with-radix-and-tailwind-css

[^1_9]: https://www.rsteg.com/radix-tailwind/

[^1_10]: https://www.uxpin.com/studio/blog/tailwind-best-practices/

[^1_11]: https://www.and.digital/spotlight/designing-complex-desktop-interfaces

[^1_12]: https://learn.microsoft.com/en-us/windows/apps/design/basics/navigation-basics

[^1_13]: https://m1.material.io/patterns/navigation.html

[^1_14]: https://namastedev.com/blog/react-router-dom-best-practices-3/

[^1_15]: https://react-community-tools-practices-cheatsheet.netlify.app/state-management/overview/

[^1_16]: https://www.reddit.com/r/reactjs/comments/1inlrx5/how_is_state_management_handled_in_realworld/

[^1_17]: https://blog.logrocket.com/tauri-adoption-guide/

[^1_18]: https://www.gethopp.app/blog/tauri-vs-electron

[^1_19]: https://www.reddit.com/r/javascript/comments/1cxsbvz/askjs_tauri_or_electron_which_one_is_suitable_for/

[^1_20]: https://www.youtube.com/watch?v=CEXex3xdKro

[^1_21]: https://www.w3.org/WAI/ARIA/apg/

[^1_22]: https://accessibilityspark.com/aria-accessibility/

[^1_23]: https://dev.to/sarahokolo/best-practices-for-optimizing-the-performance-of-your-react-application-2e4c

[^1_24]: https://shashanknathe.com/blog/desktop-app-with-react-electron-shadcn

[^1_25]: https://arxiv.org/html/2411.01606v1

[^1_26]: https://arxiv.org/html/2406.16386v1

[^1_27]: https://arxiv.org/html/2504.03884v1

[^1_28]: http://thescipub.com/pdf/10.3844/ajassp.2017.1081.1092

[^1_29]: https://lupinepublishers.com/computer-science-journal/pdf/CTCSA.MS.ID.000131.pdf

[^1_30]: http://arxiv.org/pdf/2409.16656.pdf

[^1_31]: https://www.techrxiv.org/articles/preprint/Engineering_testable_and_maintainable_software_with_Spring_Boot_and_React/15147723/2/files/29129769.pdf

[^1_32]: https://ph.pollub.pl/index.php/jcsi/article/view/6299

[^1_33]: http://arxiv.org/pdf/2502.15707.pdf

[^1_34]: https://arxiv.org/pdf/2308.16024.pdf

[^1_35]: https://onlinelibrary.wiley.com/doi/pdfdirect/10.1002/stvr.1748

[^1_36]: https://journals.ur.edu.pl/jetacomps/article/download/9124/7593

[^1_37]: https://dl.acm.org/doi/pdf/10.1145/3647632.3647989

[^1_38]: https://czasopisma.kul.pl/LingBaW/article/download/5372/5222

[^1_39]: http://eartharxiv.org/repository/object/2545/download/5180/

[^1_40]: https://ojs.unikom.ac.id/index.php/injuratech/article/download/6759/2931

[^1_41]: https://jurnal.ubl.ac.id/index.php/explore/article/download/3647/2755

[^1_42]: https://ph.pollub.pl/index.php/jcsi/article/download/2827/2658

[^1_43]: https://nottingham-repository.worktribe.com/preview/758132/paper.pdf

[^1_44]: https://publications.eai.eu/index.php/sis/article/download/4959/2844

[^1_45]: https://cursor.directory/rules/radix-ui

[^1_46]: https://www.radix-ui.com/themes/docs/overview/styling

[^1_47]: https://developer.apple.com/design/human-interface-guidelines

[^1_48]: https://www.sencha.com/blog/how-to-choose-the-right-react-component-ui-library-for-your-project/

[^1_49]: https://www.tailwindresources.com/category/radix-ui/

[^1_50]: https://v2.tauri.app/concept/process-model/

[^1_51]: https://www.interaction-design.org/literature/article/user-interface-design-guidelines-10-rules-of-thumb

[^1_52]: https://blog.logrocket.com/radix-ui-adoption-guide/

[^1_53]: https://github.com/radix-ui/primitives/discussions/1000

[^1_54]: https://www.codecentric.de/en/knowledge-hub/blog/electron-tauri-building-desktop-apps-web-technologies

[^1_55]: https://learn.microsoft.com/en-us/windows/win32/uxguide/designprinciples

[^1_56]: https://dev.to/webdevlapani/the-journey-of-choosing-the-best-ui-component-library-with-reactjs-251k

[^1_57]: https://ieeexplore.ieee.org/document/9351933/

[^1_58]: https://dl.acm.org/doi/10.1145/989863.989911

[^1_59]: https://ieeexplore.ieee.org/document/7836035/

[^1_60]: https://ieeexplore.ieee.org/document/10286664/

[^1_61]: https://rayyanjurnal.com/index.php/qistina/article/view/4227

[^1_62]: https://isjem.com/download/simplifying-desktop-application-development-a-tkinter-based-gui-system-with-intelligent-interface-architecture/

[^1_63]: https://www.mdpi.com/2078-2489/15/11/732

[^1_64]: https://online-journals.org/index.php/i-jim/article/view/36937

[^1_65]: https://journal.arjunu.org/index.php/lingtech/article/view/3

[^1_66]: http://www.sedoptica.es/Menu_Volumenes/Pdfs/OPA_52_2_51008.pdf

[^1_67]: https://al-kindipublisher.com/index.php/jcsts/article/download/2511/2192

[^1_68]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9792669/

[^1_69]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11435723/

[^1_70]: https://www.mdpi.com/2078-2489/13/5/236/pdf?version=1653664375

[^1_71]: http://thescipub.com/pdf/10.3844/jcssp.2007.154.161

[^1_72]: http://downloads.hindawi.com/journals/ahci/2017/6787504.pdf

[^1_73]: https://www.mdpi.com/1424-8220/24/18/5966

[^1_74]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9568819/

[^1_75]: https://res.mdpi.com/d_attachment/proceedings/proceedings-31-00019/article_deploy/proceedings-31-00019-v2.pdf

[^1_76]: https://www.justinmind.com/blog/navigation-design-almost-everything-you-need-to-know/

[^1_77]: https://ui-patterns.com/patterns/navigation/list

[^1_78]: https://userpilot.com/blog/navigation-ux/

[^1_79]: https://github.com/tauri-apps/tauri/issues/6142

[^1_80]: https://www.uxpin.com/studio/blog/navigation-ui/

[^1_81]: https://www.nngroup.com/articles/vertical-nav/

[^1_82]: https://martinfowler.com/articles/modularizing-react-apps.html

[^1_83]: https://dribbble.com/tags/desktop-navigation

[^1_84]: https://aptabase.com/blog/why-chose-to-build-on-tauri-instead-electron

[^1_85]: https://www.reddit.com/r/reactjs/comments/1gon61u/scalable_reactjs_frontend_architecture_for_a/

[^1_86]: https://www.ijraset.com/best-journal/a-review-on-react-admin-dashboard-741

[^1_87]: https://journal.esrgroups.org/jes/article/view/2170

[^1_88]: https://journals.uran.ua/vestnikpgtu_tech/article/view/310670

[^1_89]: https://www.semanticscholar.org/paper/c7b0cc1fb03aaeb08af41152fa2be470716b128f

[^1_90]: https://www.semanticscholar.org/paper/0880e2c45b74ceb547ee30c94ac68127d25aed5c

[^1_91]: https://ieeexplore.ieee.org/document/8835383/

[^1_92]: https://www.semanticscholar.org/paper/5ec99568f20f02a6f20116b29650dcea032b75a0

[^1_93]: https://dl.acm.org/doi/10.1145/2978192.2978229

[^1_94]: https://ieeexplore.ieee.org/document/11051850/

[^1_95]: https://www.semanticscholar.org/paper/6736d5e8ebada5e568292e1b08bfe711c702797a

[^1_96]: https://ijsrcseit.com/paper/CSEIT217647.pdf

[^1_97]: https://arxiv.org/pdf/2212.05203.pdf

[^1_98]: https://arxiv.org/html/2408.02057v1

[^1_99]: https://hygraph.com/blog/routing-in-react

[^1_100]: https://trio.dev/guide-to-react-router-v6/

[^1_101]: https://stackoverflow.com/questions/38602146/react-router-best-practices-for-nested-navigation

[^1_102]: https://reactrouter.com

[^1_103]: https://tecnovy.com/en/component-software-architecture-guide

[^1_104]: https://www.geeksforgeeks.org/system-design/component-based-architecture-system-design/

[^1_105]: https://pangea.ai/resources/react-state-tools

[^1_106]: https://www.travis-ci.com/blog/react-router-demystified-a-developers-guide-to-efficient-routing/

[^1_107]: https://www.prolim.com/what-is-component-based-architecture/

[^1_108]: https://kentcdodds.com/blog/application-state-management-with-react

[^1_109]: https://www.scitepress.org/DigitalLibrary/Link.aspx?doi=10.5220/0012421400003645

[^1_110]: https://dl.acm.org/doi/10.1145/3365610.3368420

[^1_111]: https://www.webology.org/abstract.php?id=1069

[^1_112]: https://www.semanticscholar.org/paper/9d50bd9c1d6c59fd0c803c18e622b9fdd8eb3b86

[^1_113]: http://link.springer.com/10.1007/s10209-014-0397-5

[^1_114]: http://services.igi-global.com/resolvedoi/resolve.aspx?doi=10.4018/978-1-5225-0945-5.ch006

[^1_115]: http://link.springer.com/10.1007/978-3-319-44748-3_22

[^1_116]: https://ieeexplore.ieee.org/document/9908726/

[^1_117]: https://www.semanticscholar.org/paper/55f02012bb7aa66d87473956f47c6e453e5b0f48

[^1_118]: https://isjem.com/download/convo-zone/

[^1_119]: https://dl.acm.org/doi/pdf/10.1145/3613904.3642822

[^1_120]: http://conference.scipy.org/proceedings/scipy2019/pdfs/shammamah_hossain.pdf

[^1_121]: https://www.scienceopen.com/document_file/22b3958b-01c0-43ef-92c9-950a28bf14b3/ScienceOpen/359_Hutchinson.pdf

[^1_122]: https://arxiv.org/pdf/2206.10352.pdf

[^1_123]: https://arxiv.org/pdf/2009.01417.pdf

[^1_124]: https://arxiv.org/pdf/2101.11103.pdf

[^1_125]: https://arxiv.org/html/2409.00582v1

[^1_126]: https://arxiv.org/pdf/2205.13945.pdf

[^1_127]: https://ui.shadcn.com

[^1_128]: https://www.shadcn.io/ui

[^1_129]: https://teamdev.com/jxbrowser/blog/desktop-app-with-web-ui/

[^1_130]: https://www.reddit.com/r/java/comments/1mo4f7l/java_desktop_app_with_shadcn_ui/

[^1_131]: https://www.shadcn.io

[^1_132]: https://hounder.co/the-dog-bowl/unlocking-the-power-of-headless-design-systems

[^1_133]: https://github.com/birobirobiro/awesome-shadcn-ui

[^1_134]: https://headlessui.com

[^1_135]: https://dev.to/accessibly_speaking/introduction-to-aria-a-developers-guide-3c25

[^1_136]: https://ui.shadcn.com/docs/components

[^1_137]: https://uxdesign.cc/headless-design-systems-in-figma-df141768929a

[^1_138]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA


---

# what are common mistakes and errors people face when designing for desktop using those frameworks?

Common mistakes and errors in designing desktop applications with React, Radix UI, Tailwind CSS, Electron, and Tauri include both implementation pitfalls and broader design oversights. These problems can degrade user experience, accessibility, performance, and maintainability significantly.[^2_1][^2_2][^2_3][^2_4]

## Styling and Integration Issues

- **CSS Specificity Conflicts**: Tailwind CSS utilities sometimes override or clash with Radix UI component styles, especially in production environments or with certain build tools. Incorrect import order or insufficient specificity may lead to unintended rendering results, such as Radix themes being overridden by Tailwind base styles.[^2_2][^2_3]
- **Improper Import Order**: Failing to load stylesheets in the recommended order can cause Radix UI or Tailwind CSS to behave inconsistently—especially when global styles and theme files are split during build.[^2_3]
- **Unstyled or Partially Styled UI Primitives**: Not fully styling headless Radix UI primitives leads to bland or unusable interfaces, as these rely on developers to provide all visual cues and affordances.[^2_5]
- **Inconsistent Design Tokens**: Using mixed tone, padding, or scale values between Tailwind and Radix UI without a cohesive design system produces a fragmented look and feel.[^2_6][^2_7]


## UX and Usability Mistakes

- **Ignoring Accessibility**: Failing to configure ARIA attributes, label elements, or keyboard navigation correctly on interactive components leads to major accessibility gaps—even though Radix UI is accessibility-focused, user implementation is still critical.[^2_7]
- **Not Considering Desktop Workflows**: Designing layouts like web or mobile apps (e.g., large touch targets, mobile navigation) instead of optimizing for desktop usability and mouse/keyboard precision.[^2_4]
- **Overlooking System Integration**: Neglecting features like drag-and-drop, system tray, window management, and optimizing for different OS conventions results in an experience that feels “webby” and less like a native desktop app.[^2_8]
- **Missing Error States and Guards**: Omitting explicit UI feedback for loading, errors, and edge cases can make desktop UIs confusing and hard to recover from, especially in data-rich business applications.[^2_6]


## Performance and Maintainability Pitfalls

- **Heavy Bundles and Inefficient Hydration**: Not using modular rendering or adaptive hydration strategies in React can cause poor performance and slow startup, especially in Electron and Tauri environments.[^2_9][^2_4]
- **Not Testing Across Platforms**: Tauri and Electron can behave differently on Windows, Linux, and Mac, often leading to unhandled edge cases that only surface in limited environments.[^2_4]
- **Over-complex State Management**: Using deep prop drilling or excessive global state without context or tools like TanStack Query can create maintenance headaches and unexpected bugs.[^2_10]


## Troubleshooting and Build Errors

- **Build Failures due to Limited System Resources**: Desktop packaging can fail if system memory is limited—especially with Electron.[^2_11]
- **Dependency Hell**: Incorrect versions or conflicting modules for React, Tailwind, Radix UI, and framework-specific bindings cause build breakages and hard-to-trace runtime errors.[^2_12][^2_11]
- **Platform-Specific Bugs**: Issues like window drag behavior, menu bar integration, or extension support sometimes require special configuration or platform-specific code that developers overlook initially.[^2_8][^2_4]

***

Avoiding these mistakes involves carefully planning your component hierarchy, strictly following recommended style import orders, prioritizing accessibility, and testing across all intended platforms. Developers should use tooling for accessibility and UI regression testing, maintain a single source of design tokens, and leverage framework best practices for modularization and routing.[^2_1][^2_2][^2_3][^2_4]
<span style="display:none">[^2_13][^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_20][^2_21][^2_22][^2_23][^2_24][^2_25][^2_26][^2_27][^2_28][^2_29][^2_30][^2_31][^2_32][^2_33][^2_34][^2_35][^2_36][^2_37][^2_38][^2_39][^2_40][^2_41]</span>

<div style="text-align: center">⁂</div>

[^2_1]: https://www.sencha.com/blog/top-mistakes-developers-make-when-using-react-ui-component-library-and-how-to-avoid-them/

[^2_2]: https://stackoverflow.com/questions/77480221/why-applying-tailwindcss-and-custom-css-classes-on-radixui-is-not-working

[^2_3]: https://github.com/radix-ui/themes/issues/109

[^2_4]: https://www.reddit.com/r/tauri/comments/1kg5zb8/will_tauri_feel_snappier_than_an_electron_app/

[^2_5]: https://www.reddit.com/r/reactjs/comments/1g04jj2/for_those_wanting_to_get_into_unstyled_ui/

[^2_6]: https://cursor.directory/rules/radix-ui

[^2_7]: https://javascript.plainenglish.io/shadcn-ui-vs-radix-ui-vs-tailwind-ui-which-should-you-choose-in-2025-b8b4cadeaa25

[^2_8]: https://www.youtube.com/watch?v=CEXex3xdKro

[^2_9]: https://arxiv.org/html/2504.03884v1

[^2_10]: https://www.reddit.com/r/reactjs/comments/1inlrx5/how_is_state_management_handled_in_realworld/

[^2_11]: https://create-react-app.dev/docs/troubleshooting/

[^2_12]: https://github.com/tauri-apps/tauri/discussions/4873

[^2_13]: https://arxiv.org/html/2411.01606v1

[^2_14]: https://arxiv.org/pdf/2009.01417.pdf

[^2_15]: https://arxiv.org/pdf/2205.13945.pdf

[^2_16]: https://arxiv.org/html/2406.16386v1

[^2_17]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11157604/

[^2_18]: https://www.mdpi.com/1424-8220/23/8/3823/pdf?version=1681289750

[^2_19]: https://onlinelibrary.wiley.com/doi/pdfdirect/10.1002/stvr.1748

[^2_20]: https://arxiv.org/pdf/2208.06658.pdf

[^2_21]: http://arxiv.org/pdf/2409.16656.pdf

[^2_22]: http://arxiv.org/pdf/2502.15707.pdf

[^2_23]: https://ph.pollub.pl/index.php/jcsi/article/view/6299

[^2_24]: https://www.techrxiv.org/articles/preprint/Engineering_testable_and_maintainable_software_with_Spring_Boot_and_React/15147723/2/files/29129769.pdf

[^2_25]: https://nottingham-repository.worktribe.com/preview/758132/paper.pdf

[^2_26]: https://arxiv.org/pdf/2308.16024.pdf

[^2_27]: https://czasopisma.kul.pl/LingBaW/article/download/5372/5222

[^2_28]: https://carijournals.org/journals/index.php/IJCE/article/download/1821/2195

[^2_29]: https://ojs.unikom.ac.id/index.php/injuratech/article/download/6759/2931

[^2_30]: https://publications.eai.eu/index.php/sis/article/download/4959/2844

[^2_31]: https://arxiv.org/pdf/2310.13518.pdf

[^2_32]: https://stackoverflow.com/questions/79718321/tooltip-from-radix-ui-react-tooltip-not-unmounting-when-using-tailwind-animate

[^2_33]: https://teamtreehouse.com/community/createreactapp-not-working-with-windows-10

[^2_34]: https://stackoverflow.com/questions/47843056/create-react-app-not-working

[^2_35]: https://github.com/radix-ui/primitives/discussions/1000

[^2_36]: https://dev.to/dedsyn4ps3/goodbye-electron-hello-tauri-26d5

[^2_37]: https://reactnative.dev/docs/troubleshooting

[^2_38]: https://ncoughlin.com/posts/design-systems

[^2_39]: https://softwarelogic.co/en/blog/how-to-choose-electron-or-tauri-for-modern-desktop-apps/

[^2_40]: https://www.reddit.com/r/reactjs/comments/16dnmj1/why_does_my_react_app_working_on_my_computer_but/

[^2_41]: https://news.ycombinator.com/item?id=43543241


---

# Explore best practices for avoiding UI design mistakes on desktop

To avoid UI design mistakes on desktop, follow established best practices that prioritize clarity, consistency, accessibility, and user-centric design. These principles yield interfaces that are easier to use and visually coherent, minimizing frustration and errors for end users.[^3_1][^3_2][^3_3][^3_4]

## Principles and Practical Guidelines

### Prioritize Clarity and Simplicity

- **Clear Visual Hierarchy**: Organize content so that the most important elements are visually prominent using size, color, and contrast. This guides users naturally to primary actions without confusion.[^3_5][^3_4]
- **Reduce Clutter**: Avoid unnecessary decorations, excessive text, and redundant components. Simplicity outperforms flashy but overloaded designs, lowering cognitive load.[^3_3][^3_4][^3_6]


### Focus on Consistency and Intuitive Interactions

- **Consistent Patterns**: Use unified design tokens for spacings, colors, and fonts. Ensure that elements functioning similarly look and behave the same across the app.[^3_4][^3_7]
- **Predictable Behavior**: Interactive elements (buttons, links) should always provide feedback, indicating loading, success, or error states.[^3_1][^3_4]
- **Accessible Navigation**: Maintain clear, logical navigation structures. Always let users know where they are, how they got there, and how to return to previous states.[^3_3][^3_1]


### Enhance Accessibility and Inclusiveness

- **Contrast and Typography**: Use adequate contrast between text and backgrounds for readability; select legible fonts and appropriate font sizes.[^3_5][^3_4]
- **Keyboard and Screen Reader Support**: Implement ARIA attributes and ensure all navigation and clickable elements are usable without a mouse.[^3_2]
- **Error Prevention and Friendly Recovery**: Provide helpful warnings before user errors occur, and design undo functions for risky actions.[^3_8][^3_9]


### Test and Analyze User Experience

- **Gather User Feedback**: Continuously seek and implement feedback from real users through usability testing and session recordings to discover pain points.[^3_10][^3_11][^3_3]
- **Iterative Improvements**: Incorporate a structured process of prototyping, validating, and revising based on user research and performance analytics.[^3_12][^3_3]


### Common Mistakes to Avoid

| Mistake | How to Avoid |
| :-- | :-- |
| Cluttered Layouts | Remove unnecessary elements; keep visual focus[^3_3][^3_4] |
| Inconsistent Button Styles | Unify style, position, and feedback[^3_7][^3_4] |
| Lack of Contrast | Always test color contrast and typography[^3_5][^3_4] |
| Poor Feedback and Errors | Design clear, actionable error messages[^3_1][^3_9] |
| Unclear Icons/Labels | Pair icons with text or tooltips for clarity[^3_1][^3_4] |
| Ignoring Accessibility | Test with screen readers and follow accessibility guides[^3_2][^3_3] |
| Failure to Test | Run usability and accessibility tests regularly[^3_3][^3_10][^3_11] |

By adhering to these best practices—simplifying layouts, refining feedback, maintaining design consistency, supporting accessibility, and rigorously testing—desktop UI design mistakes become far less frequent, resulting in more engaging and reliable applications.[^3_7][^3_4][^3_1][^3_3]
<span style="display:none">[^3_13][^3_14][^3_15][^3_16][^3_17][^3_18][^3_19][^3_20][^3_21][^3_22][^3_23][^3_24][^3_25][^3_26][^3_27][^3_28][^3_29][^3_30][^3_31][^3_32][^3_33][^3_34][^3_35][^3_36][^3_37][^3_38][^3_39][^3_40]</span>

<div style="text-align: center">⁂</div>

[^3_1]: https://www.nngroup.com/articles/top-10-application-design-mistakes/

[^3_2]: https://design4users.com/ux-design-preventing-errors-in-user-interfaces/

[^3_3]: https://www.thealien.design/insights/ux-design-mistakes

[^3_4]: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips

[^3_5]: https://www.figma.com/resource-library/ui-design-principles/

[^3_6]: https://www.apptunix.com/blog/ui-ux-mistakes-to-avoid-for-a-scalable-app-development/

[^3_7]: https://www.uxpin.com/studio/blog/guide-design-consistency-best-practices-ui-ux-designers/

[^3_8]: https://www.nngroup.com/articles/user-mistakes/

[^3_9]: https://blog.logrocket.com/ux-design/ux-error-prevention-examples/

[^3_10]: https://www.hotjar.com/ui-design/problems/

[^3_11]: https://userpilot.com/blog/ux-mistakes/

[^3_12]: https://ejournal.pancawidya.or.id/index.php/galaksi/article/view/4

[^3_13]: https://ejournal.ikado.ac.id/index.php/teknika/article/view/854

[^3_14]: https://jurnalsyntaxadmiration.com/index.php/jurnal/article/view/1925

[^3_15]: https://ieeexplore.ieee.org/document/9402543/

[^3_16]: https://www.mdpi.com/2076-3417/15/3/1060

[^3_17]: https://ieeexplore.ieee.org/document/10348017/

[^3_18]: https://ieeexplore.ieee.org/document/9609767/

[^3_19]: https://aircconline.com/csit/papers/vol14/csit140821.pdf

[^3_20]: https://www.semanticscholar.org/paper/473376f54346ca981ac0187e886da66857c614d4

[^3_21]: https://arxiv.org/abs/2204.07336

[^3_22]: https://arxiv.org/pdf/2205.13945.pdf

[^3_23]: https://arxiv.org/pdf/2009.01417.pdf

[^3_24]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11157604/

[^3_25]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9568819/

[^3_26]: http://thescipub.com/pdf/10.3844/jcssp.2013.1443.1450

[^3_27]: http://downloads.hindawi.com/journals/ahci/2017/6787504.pdf

[^3_28]: http://arxiv.org/pdf/2404.12500.pdf

[^3_29]: https://arxiv.org/html/2411.01606v1

[^3_30]: https://jurnalnasional.ump.ac.id/index.php/JUITA/article/download/17643/pdf

[^3_31]: https://recyt.fecyt.es/index.php/retos/article/download/103272/76259

[^3_32]: https://www.reddit.com/r/truegamedev/comments/jpehwb/obvious_uiux_design_mistakes_and_how_to_avoid_them/

[^3_33]: https://contentsquare.com/guides/ux-design/mistakes/

[^3_34]: https://www.altamira.ai/blog/ui-design-mistakes/

[^3_35]: https://designlab.com/blog/form-ui-design-best-practices

[^3_36]: https://www.interaction-design.org/literature/article/bad-ux-examples

[^3_37]: https://www.and.digital/spotlight/designing-complex-desktop-interfaces

[^3_38]: https://baymard.com/blog/desktop-ux-ecommerce

[^3_39]: https://pageflows.com/resources/user-interface-design-tips-and-best-practices/

[^3_40]: https://www.autify.co.uk/blog/12-common-ux-ui-web-design-mistakes-and-how-to-fix-them/


---

# Layout Structure, Spacing, Margin and Padding: A Comprehensive Guide

## Foundational Spacing Systems

### The 8-Point Grid System

The most widely adopted spacing system in modern UI design is the **8-point grid system**. This system uses multiples of 8 pixels (8, 16, 24, 32, 40, 48, 56, etc.) for layout dimensions, padding, and margins. The 8pt grid provides several key advantages:[^4_1][^4_2]

- **Scalability**: Works seamlessly across different screen sizes and resolutions[^4_1]
- **Consistency**: Creates visual harmony by maintaining predictable spacing relationships[^4_2]
- **Developer-Friendly**: Aligns with common screen densities and scaling factors[^4_3]
- **Reduced Decision Fatigue**: Limits spacing options to prevent inconsistency[^4_3]

![8pt grid system spacing examples UI design]

![Desktop sidebar UI layout demonstrating spaced components based on an 8pt grid system with detailed pixel measurements for margins and padding.](https://pplx-res.cloudinary.com/image/upload/v1756752504/pplx_project_search_images/5295401e4018ba7a7b897edebfc9f130f15a411e.png)

Desktop sidebar UI layout demonstrating spaced components based on an 8pt grid system with detailed pixel measurements for margins and padding.

### Alternative Grid Systems

While 8pt is preferred, other systems exist based on specific needs:[^4_3]

- **4-Point Grid**: Better for mobile interfaces requiring tighter spacing[^4_4][^4_5]
- **5-Point Grid**: Can create odd-number issues and pixel splitting problems[^4_3]
- **6-Point Grid**: Less common, can create too many variables[^4_3]
- **10-Point Grid**: Used for larger desktop interfaces requiring more generous spacing[^4_6]


## Understanding Margin vs. Padding

### Core Definitions

The distinction between **margin** and **padding** is fundamental to proper layout structure:[^4_7][^4_5]

**Margin**: External spacing around an element that creates separation from other elements[^4_5][^4_7]
**Padding**: Internal spacing within an element that creates breathing room between content and borders[^4_7][^4_5]

![proper padding margin layout structure web design]

![Illustration showing the difference between inner spacing (padding) and outer spacing (margin) in a navigation bar layout.](https://pplx-res.cloudinary.com/image/upload/v1754837103/pplx_project_search_images/2c90f02844f744bc4fe67cd69a7be22865592f00.png)

Illustration showing the difference between inner spacing (padding) and outer spacing (margin) in a navigation bar layout.

### The Internal ≤ External Rule

A critical principle for balanced layouts is that internal spacing (padding) should be equal to or less than external spacing (margin). This rule, rooted in Gestalt psychology principles of proximity, ensures:[^4_1]

- Elements within a container feel cohesive
- Different sections remain visually distinct
- Clear visual hierarchy is maintained
- Related elements are perceived as groups[^4_1]

![good bad UI spacing examples desktop app design]

![Comparison of bad and good UI spacing in a customer reviews layout highlighting better margin and padding in the good example.](https://pplx-res.cloudinary.com/image/upload/v1757591940/pplx_project_search_images/e9bb6604058c73e713df7c3d968970f065b8d46e.png)

Comparison of bad and good UI spacing in a customer reviews layout highlighting better margin and padding in the good example.

## Responsive Spacing Guidelines

### Desktop-Specific Spacing Recommendations

For desktop applications, spacing should accommodate larger screen real estate and precision input methods:[^4_6]

**Page Margins**:

- 1025px-1439px screens: 80px margins
- 1440px-1920px screens: 120px margins[^4_6]

**Component Spacing**:

- Small components (0-8px): For compact UI elements like badges and buttons[^4_2]
- Medium components (12-24px): For larger components and content separation[^4_2]
- Large spacing (32-80px): For major layout sections and page-level organization[^4_2]


### Mobile vs. Desktop Considerations

Different devices require adjusted spacing scales:[^4_6]


| Device Type | Base Unit | Margins | Typical Range |
| :-- | :-- | :-- | :-- |
| Mobile (320-479px) | 2-4pt | 16px | Tighter spacing |
| Mobile (480-700px) | 4-5pt | 24px | Moderate spacing |
| Tablet (701-1024px) | 4-8pt | 32px | Expanded spacing |
| Desktop (1025px+) | 8-10pt | 80-120px | Generous spacing |

## Good vs. Bad Spacing Examples

### Common Spacing Mistakes

**Cluttered Layouts**: Insufficient spacing between elements creates cognitive overload. Elements appear to compete for attention rather than working together harmoniously.[^4_8][^4_9]

**Inconsistent Spacing**: Using arbitrary spacing values instead of a systematic approach. This creates visual chaos and unprofessional appearance.[^4_10]

**Poor Hierarchy**: Equal spacing between all elements fails to establish visual relationships. Users cannot distinguish between primary and secondary content.[^4_10]

**Inadequate Breathing Room**: Cramped text and interface elements reduce readability and usability.[^4_11][^4_12]

### Examples of Effective Spacing

**Proper Visual Hierarchy**: Using varied spacing to create clear content relationships. Larger spacing separates major sections while smaller spacing groups related elements.[^4_12]

**Consistent Grid Adherence**: Following systematic spacing rules creates visual harmony. Elements align predictably and feel professionally designed.[^4_2]

**Appropriate Density**: Balancing information density with usability. Desktop applications can accommodate more content than mobile interfaces.[^4_2]

**Strategic White Space**: Using negative space to guide user attention and improve comprehension.[^4_13][^4_12]

![cluttered vs clean layout spacing comparison]

![List of seven bad UI design examples highlighting issues with layout and spacing such as overlapping elements and cluttered layout.](https://pplx-res.cloudinary.com/image/upload/v1754712851/pplx_project_search_images/d482c6a01d011d1075ae1fdaaf67718fd18b7fb1.png)

List of seven bad UI design examples highlighting issues with layout and spacing such as overlapping elements and cluttered layout.

## Practical Implementation Guidelines

### Setting Up Spacing Systems

**Choose Your Base Unit**: Select 4pt, 8pt, or 10pt based on your platform and aesthetic goals[^4_3][^4_1]

**Create Your Scale**: Build a limited set of spacing values (typically 8-12 options) using multiples of your base unit[^4_2]

**Document Patterns**: Establish clear rules for when to use each spacing value[^4_2]

**Test Across Devices**: Ensure your spacing system works at different screen sizes and resolutions[^4_7]

### CSS Implementation Best Practices

**Use Relative Units**: Implement responsive spacing with viewport units (vw, vh) or percentages instead of fixed pixels[^4_7]

**Leverage CSS Variables**: Define spacing tokens for consistent application across your codebase[^4_2]

**Consider Negative Margins**: Strategic use of negative margins can create overlapping effects and unique layouts[^4_7]

**Maintain Consistency**: Apply the same spacing rules across all components and pages[^4_2]

## Desktop Application Specific Considerations

### Navigation and Sidebar Spacing

Desktop applications require specific spacing considerations for navigation elements:

- **Sidebar Width**: Typically 240-280px with 16-24px internal padding
- **Menu Item Spacing**: 8-12px vertical spacing between navigation items
- **Icon Alignment**: 16px spacing between icons and text labels
- **Hierarchical Indentation**: 24-32px indentation for sub-menu items


### Content Area Layout

**Main Content Margins**: 24-40px from sidebar and window edges
**Section Separation**: 48-64px between major content sections
**Card Components**: 16-24px internal padding with 16px gaps between cards
**Form Elements**: 16px spacing between form fields, 8px between labels and inputs

### Window and Dialog Spacing

**Dialog Padding**: 24-32px internal padding for modal dialogs
**Button Spacing**: 8-12px between action buttons
**Content Margins**: 16-24px from dialog edges to content

This systematic approach to spacing, margin, and padding creates professional, usable desktop applications that feel polished and intuitive to users. The key is consistency, appropriate scale selection, and understanding the relationship between different spacing elements in your design system.[^4_1][^4_2][^4_10]
<span style="display:none">[^4_14][^4_15][^4_16][^4_17][^4_18][^4_19][^4_20][^4_21][^4_22][^4_23][^4_24][^4_25][^4_26][^4_27][^4_28][^4_29][^4_30][^4_31][^4_32][^4_33][^4_34][^4_35][^4_36][^4_37][^4_38][^4_39][^4_40][^4_41][^4_42][^4_43][^4_44][^4_45][^4_46][^4_47][^4_48][^4_49][^4_50][^4_51][^4_52][^4_53][^4_54][^4_55][^4_56][^4_57][^4_58][^4_59][^4_60][^4_61][^4_62][^4_63][^4_64][^4_65][^4_66][^4_67][^4_68][^4_69][^4_70][^4_71][^4_72]</span>

<div style="text-align: center">⁂</div>

[^4_1]: https://cieden.com/book/sub-atomic/spacing/spacing-best-practices

[^4_2]: https://atlassian.design/foundations/spacing

[^4_3]: https://www.designsystems.com/space-grids-and-layouts/

[^4_4]: https://www.thedesignership.com/blog/the-ultimate-spacing-guide-for-ui-designers

[^4_5]: https://uxplanet.org/principles-of-spacing-in-ui-design-a-beginners-guide-to-the-4-point-spacing-system-6e88233b527a

[^4_6]: https://cieden.com/book/sub-atomic/spacing/spacing-for-desktop-and-mobile-designs

[^4_7]: https://productiveshop.com/padding-vs-margin/

[^4_8]: https://www.ofspace.co/blog/bad-ui-examples

[^4_9]: https://www.interaction-design.org/literature/article/bad-ui-design-examples

[^4_10]: https://reallygooddesigns.com/common-design-mistakes/

[^4_11]: https://www.flowmapp.com/blog/qa/common-mistakes-in-ui

[^4_12]: https://www.crazyegg.com/blog/white-space-website-design/

[^4_13]: https://www.justinmind.com/blog/white-space-design/

[^4_14]: https://eajournals.org/ejcsit/vol13-issue21-2025/balancing-performance-and-area-in-high-speed-analog-layout-design-systematic-approaches-to-drc-lvs-optimization/

[^4_15]: https://www.semanticscholar.org/paper/13985a2e81a5e72b894fe47e2dae3eb999e3e149

[^4_16]: https://www.tandfonline.com/doi/full/10.1080/14942119.2018.1517998

[^4_17]: https://www.semanticscholar.org/paper/ce689bfb8dfc49c0890a9655c10d09fd5ae7fe6a

[^4_18]: https://www.semanticscholar.org/paper/d0e54949f8491efaedb842e9cdf4a4a2a5209a7d

[^4_19]: https://link.springer.com/10.1007/978-3-319-91806-8_22

[^4_20]: https://www.semanticscholar.org/paper/2b9b70dc3285cd92baf6918f85c17cb2bf54332a

[^4_21]: https://www.semanticscholar.org/paper/9af689005828dbbbec9de1bd1bad6c89fb3d4ed6

[^4_22]: https://dl.acm.org/doi/10.1145/1520340.1520637

[^4_23]: http://peer.asee.org/18108

[^4_24]: https://arxiv.org/pdf/2307.12522.pdf

[^4_25]: https://arxiv.org/pdf/1409.3993.pdf

[^4_26]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11435723/

[^4_27]: https://www.mdpi.com/1424-8220/24/18/5966

[^4_28]: https://www.rairo-ro.org/articles/ro/pdf/2021/07/ro210160.pdf

[^4_29]: https://downloads.hindawi.com/journals/ahci/2011/659758.pdf

[^4_30]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9568819/

[^4_31]: https://lupinepublishers.com/computer-science-journal/pdf/CTCSA.MS.ID.000131.pdf

[^4_32]: https://arxiv.org/pdf/2308.12700.pdf

[^4_33]: http://downloads.hindawi.com/journals/ahci/2017/6787504.pdf

[^4_34]: https://m3.material.io/foundations/layout/understanding-layout/overview

[^4_35]: https://www.nngroup.com/articles/breakpoints-in-responsive-design/

[^4_36]: https://m2.material.io/design/layout/understanding-layout.html

[^4_37]: https://m3.material.io/foundations/layout/understanding-layout/spacing

[^4_38]: https://blog.tubikstudio.com/negative-space-in-design-tips-and-best-practices-2/

[^4_39]: https://m2.material.io/design/layout/spacing-methods.html

[^4_40]: https://duck.design/good-vs-bad-graphic-design/

[^4_41]: https://www.uiprep.com/blog/everything-you-need-to-know-about-spacing-layout-grids

[^4_42]: https://muffingroup.com/blog/white-space-in-web-design/

[^4_43]: https://www.reddit.com/r/UI_Design/comments/19892tg/padding_best_practices/

[^4_44]: https://www.interaction-design.org/literature/article/the-power-of-white-space

[^4_45]: https://learn.microsoft.com/en-us/windows/apps/design/layout/alignment-margin-padding

[^4_46]: https://www.semanticscholar.org/paper/daa6c713103dad143b2f654ff62152ebd723be44

[^4_47]: https://dl.acm.org/doi/10.1145/3654777.3676408

[^4_48]: https://dl.acm.org/doi/10.1145/3133956.3134040

[^4_49]: https://journals.pan.pl/dlibra/publication/144453/edition/126212/content

[^4_50]: https://openaccess.cms-conferences.org/publications/book/978-1-964867-19-9/article/978-1-964867-19-9_24

[^4_51]: http://ejournals.library.vanderbilt.edu/index.php/homiletic/article/view/3307

[^4_52]: https://www.ssrn.com/abstract=3279543

[^4_53]: https://qualitysafety.bmj.com/lookup/doi/10.1136/bmjqs-2013-002138

[^4_54]: http://www.emerald.com/ijhma/article/12/2/330-348/127213

[^4_55]: https://emj.bmj.com/lookup/doi/10.1136/emermed-2022-212999

[^4_56]: https://arxiv.org/html/2407.17681v1

[^4_57]: https://ph.pollub.pl/index.php/jcsi/article/download/3075/3093

[^4_58]: https://arxiv.org/pdf/2205.13945.pdf

[^4_59]: https://arxiv.org/pdf/2009.01417.pdf

[^4_60]: http://arxiv.org/pdf/2404.12500.pdf

[^4_61]: https://careerfoundry.com/en/blog/ui-design/common-ui-design-mistakes/

[^4_62]: https://contentsquare.com/guides/ux-design/mistakes/

[^4_63]: https://www.reddit.com/r/graphic_design/comments/1izo9yl/what_are_common_design_mistakes_you_still_see/

[^4_64]: https://www.youtube.com/watch?v=_V7HAKjyYrw

[^4_65]: https://www.reddit.com/r/Frontend/comments/19epe4x/what_spacing_systems_are_you_using/

[^4_66]: https://learn.microsoft.com/en-us/answers/questions/788940/visual-basic-application-startup-position-on-deskt

[^4_67]: https://www.reddit.com/r/techsupport/comments/15va6kz/sometimes_windows_11_icons_spacing_on_desktop_is/

[^4_68]: https://www.nngroup.com/articles/top-10-application-design-mistakes/

[^4_69]: https://consumer.huawei.com/uk/support/content/en-gb00706422/

[^4_70]: https://spaceberry.studio/blog/common-user-interface-mistakes-and-how-to-do-it-right/

[^4_71]: https://www.interaction-design.org/literature/article/bad-design-vs-good-design

[^4_72]: https://www.youtube.com/watch?v=y4Pudj8SsPU

