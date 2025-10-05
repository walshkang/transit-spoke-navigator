# Transit Spoke Navigator - Roadmap
## Museum Experience UI/UX Transformation

**Vision:** Transform route discovery into an immersive museum experience with Frutiger Aero aesthetics, jungle music-inspired animations, and AI-powered reasoning transparency.

---

## Current Status: Core Functionality Complete ✅

### What's Already Built
- ✅ Google Maps integration (Directions API, Places API)
- ✅ Location services with geolocation
- ✅ Search functionality with autocomplete
- ✅ Route calculation with walking/biking/transit segments
- ✅ Enhanced route generation (detecting long walking segments and adding bike options)
- ✅ Route detail view with collapsible step-by-step directions
- ✅ Real-time bike station availability display
- ✅ Map visualization with route polylines
- ✅ Search reset functionality
- ✅ Basic responsive UI with shadcn/ui components
- ✅ **AI-Powered Intent Interpretation** via Lovable AI Gateway (Gemini 2.5 Flash)
- ✅ **Natural Language Route Search** with real-time query parsing
- ✅ **AI Reasoning Transparency** - Chain-of-thought panel showing route decision logic
- ✅ **Intent Display Component** - Visual representation of user preferences
- ✅ **Mobile UX Enhancement** - Close button for route detail view

---

## Phase 0: Critical Bug Fixes & Core Improvements ✅ COMPLETE

### 0.1 Step Ordering & Coordinate Validation 🔥 HIGH PRIORITY
- [ ] **Fix step ordering logic in route calculation**
  - Problem: Steps currently sorted by transport mode, not geographic sequence
  - Solution: Implement lat/lng-based chaining algorithm
  - Edge case: Routes with walking segments at both start and end
- [ ] **Ensure all steps have start/end coordinates**
  - Add validation in `formatDirectionStep` helper
  - Filter or log steps missing coordinate data
  - Prevent undefined coordinate errors in step chaining
- [ ] **Test multi-segment route ordering**
  - Walking → Biking → Transit → Walking sequences
  - Verify correct ordering on map display

### 0.2 Mobile UX Improvements
- [x] ✅ Add close button to `RouteDetailsView` component
  - Users can now exit route details on mobile
  - X button added to dialog header

### 0.3 Error Handling & Edge Cases
- [ ] Handle missing Google Maps API responses gracefully
- [ ] Add loading states for bike station data
- [ ] Improve error messages for route calculation failures
- [ ] Handle cases where no enhanced route is possible

---

## Phase 1: Foundation & Design System (Weeks 1-2)

### 1.1 Visual Design System Setup
- [ ] Create Frutiger Aero color palette in `tailwind.config.ts`
  - Tertiary colors: aqua blues (#00D4FF), fresh greens (#4CAF50), translucent whites
  - Gradient utilities for glossy effects
  - Custom shadow and blur utilities for depth
- [ ] Design custom CSS animations with breakbeat timing (160ms transitions)
- [ ] Create reusable gradient background components with aurora effects
- [ ] Build glossy card component library extending shadcn/ui
  - Backdrop blur, rounded corners, semi-transparency
  - Hover states with glow and lift effects

### 1.2 Core Navigation Architecture
- [ ] Implement museum room navigation system
  - Create `<MuseumRoom>` wrapper component
  - Build swipe-based horizontal navigation between rooms
  - Add ambient gradient transitions between spaces
- [ ] Design Entry Hall (Home Screen)
  - Pulsing location orb with ripple animations
  - Quick-access pods for Recent Routes, Saved Favorites, Explore
  - Floating glassmorphic cards

---

## Phase 2: Portal System (Weeks 3-4)

### 2.1 Discovery Gallery - Four Portal Interface
- [ ] **Scenic Path Portal** (Green/Nature Theme)
  - Nature imagery, leaf motifs, park-focused gradients
  - Route optimization for waterfront, parks, landmarks
- [ ] **Safe Route Portal** (Blue/Shield Theme)
  - Translucent blue with shield iconography
  - Prioritize protected bike lanes with % safety scores
- [ ] **Speed Portal** (Red-Orange/Lightning Theme)
  - Velocity-inspired gradients, motion blur effects
  - Optimize for minimum travel time
  - Rapid pulsing animations at 160 BPM
- [ ] **Adventure Portal** (Multi-Color/Exploration Theme)
  - AI-generated unique paths mixing tourist interests and hidden gems
- [ ] Implement multi-portal selection for blended preferences
- [ ] Create portal animation system with breakbeat-timed transitions

### 2.2 Portal Interaction States
- [ ] 3D card hover effects with depth and glow
- [ ] Zoom transitions when entering portal rooms
- [ ] Portal color merging for multi-selection visual feedback

---

## Phase 3: AI Integration ✅ PHASE 3.1 COMPLETE

### 3.1 Gemini Intent Interpretation ✅ COMPLETE
- [x] ✅ Set up Lovable AI Gateway integration (using `google/gemini-2.5-flash`)
  - Edge function: `supabase/functions/parse-route-intent/index.ts`
  - No API key required from user (auto-provisioned via LOVABLE_API_KEY)
- [x] ✅ Create natural language query parsing
  - Extracts: destination, priority, secondary preferences, constraints
  - Supports: safety, scenic, speed, adventure modes
  - Handles: max duration, avoid highways, specific transport modes
- [x] ✅ Build intent interpretation UI with real-time feedback
  - Component: `src/components/IntentDisplay.tsx`
  - Shows confidence score, priority badges, constraint chips
- [x] ✅ Implement contextual tooltips explaining AI interpretations
  - Hover tooltips on all intent elements
  - Priority config with descriptions

### 3.2 Route Generation Engine Enhancement
- [x] ~~Integrate Google Maps Directions API with parameter optimization~~ ✅ COMPLETE
  - Safety scoring: % protected bike lane coverage (PLANNED)
  - Scenic rating: proximity to parks, landmarks, highly-rated Places (PLANNED)
  - Speed optimization: minimize duration with transit combinations ✅ COMPLETE
- [x] ~~Connect GBFS API for real-time bike station availability~~ ✅ COMPLETE
- [ ] Build multi-route generation (3-5 variations per query)
  - Currently generates 2 routes: original transit-only + enhanced with biking
  - Expand to scenic, safe, and adventure variants
- [ ] Create unique path algorithm by blending alternative route segments

### 3.3 Parameter Gallery (Customization Room)
- [ ] Design floating panel interface with glossy sliders
  - Bike lane coverage % slider
  - Distance/time range selectors with circular dials
  - Toggle switches for tourist attractions, quiet streets
  - Max transfers slider (Speed Portal)
  - Traffic consideration toggle (Speed Portal)
- [ ] Implement real-time miniature map preview with bokeh effects
- [ ] Add Gemini-powered trade-off tooltips
  - "Increasing safety to 90% may add 8 minutes but avoids busy intersections"

---

## Phase 4: Results & Visualization Enhancement (Weeks 7-8)

### 4.1 Route Exhibit Hall (Results Display)
- [x] ~~Basic route results display~~ ✅ COMPLETE
- [ ] Build gallery grid with spatial arrangement
  - Scenic routes cluster left, fast routes right, safe routes center
  - Non-linear browsing based on characteristics
- [ ] Design illuminated artifact route cards
  - Miniature map previews with color-coded segments
  - Glossy badges: duration, distance, safety score, scenic rating
  - Portal-specific styling (red borders for Speed, green for Scenic)
- [ ] Implement breakbeat-timed zoom into detail view
- [ ] Add ambient particle effects suggesting movement

### 4.2 Route Detail Sanctuary (Immersive View)
- [x] ~~Full-screen route experience with layered information~~ ✅ COMPLETE
  - [x] ~~Map occupies upper 60% with polyline styling~~ ✅ COMPLETE
  - [x] ~~Collapsible step-by-step directions~~ ✅ COMPLETE
  - [x] ~~Real-time bike station availability with indicators~~ ✅ COMPLETE
  - [ ] Scenic points of interest highlighting (PLANNED)
  - [ ] Frutiger Aero styling enhancements (PLANNED)
- [ ] Create floating "Navigate Now" button with gradient glow
- [ ] Add ambient drift particles across screen
- [x] ~~Implement route comparison side-by-side view~~ ✅ BASIC VERSION COMPLETE

---

## Phase 5: AI Reasoning Transparency ✅ PHASES 5.1 & 5.2 COMPLETE

### 5.1 Chain-of-Thought Reasoning Panel ✅ COMPLETE
- [x] ✅ Build expandable reasoning component (`src/components/ReasoningPanel.tsx`)
  - Collapsible card interface with expand/collapse functionality
  - Edge function: `supabase/functions/generate-reasoning/index.ts`
  - Uses Lovable AI Gateway (`google/gemini-2.5-flash`)
- [x] ✅ Design reasoning step cards with GlossyCard styling
  - Displays summary, key factors, trade-offs, highlights
  - Confidence score with progress indicator
  - Loading states with skeleton UI

### 5.2 Reasoning Level Implementation ✅ BASIC VERSION COMPLETE
- [x] ✅ **Summary Display**
  - AI-generated route explanation and rationale
- [x] ✅ **Key Factors Section**
  - List of primary decision factors considered
- [x] ✅ **Trade-offs Analysis**
  - Categorized by aspect (time, comfort, cost, etc.)
  - Shows pros/cons of route selection
- [x] ✅ **Route Highlights**
  - Notable features and recommendations
- [x] ✅ **Confidence Score**
  - Visual progress bar with percentage
- [ ] **FUTURE: Advanced Levels** (Not yet implemented)
  - Level 2: Data gathering with API call visualization
  - Level 3: Mathematical scoring formulas
  - Level 4: Alternative route comparison
  - Level 5: Override functionality

### 5.3 Interactive Reasoning Features
- [ ] Implement "Override" functionality on reasoning steps
  - Adjust biking speed assumptions and recalculate
  - Force inclusion of rejected routes to see trade-offs
  - Dynamic safety threshold adjustments with real-time re-reasoning
- [ ] Add raw data drill-down with code viewer
- [ ] Create confidence scoring visualization
- [ ] Build reasoning export for power users

---

## Phase 6: Polish & Advanced Features (Weeks 11-12)

### 6.1 Gesture & Animation Refinement
- [ ] Fine-tune swipe navigation between museum rooms
- [ ] Implement pull-to-refresh with water ripple effect
- [ ] Add pinch-to-zoom on route maps with bloom effects
- [ ] Polish all breakbeat-timed transitions (160ms timing)
- [ ] Create ambient background gradient shifts based on route type

### 6.2 Advanced AI Features
- [ ] Multi-city route generation (NYC, SF, Chicago, etc.)
- [ ] Weather-aware route suggestions
- [ ] Time-of-day optimization (rush hour avoidance)
- [ ] Historical route performance learning
- [ ] Social sharing with reasoning traces

### 6.3 Accessibility & Performance
- [ ] Ensure WCAG 2.1 AA compliance for all interactive elements
- [ ] Optimize animations for reduced motion preferences
- [ ] Implement progressive loading for reasoning traces
- [ ] Add keyboard navigation for power users
- [ ] Performance optimization for map rendering

---

## Phase 7: Testing & Iteration (Weeks 13-14)

### 7.1 User Testing
- [ ] Conduct usability tests with 10+ diverse users
- [ ] Test museum navigation metaphor comprehension
- [ ] Validate reasoning transparency usefulness
- [ ] A/B test portal arrangements and styling
- [ ] Gather feedback on Frutiger Aero aesthetic reception

### 7.2 Technical Testing
- [ ] Load testing with multiple simultaneous route generations
- [ ] API rate limit handling and error states
- [ ] Offline mode graceful degradation
- [ ] Cross-device responsive design validation
- [ ] Battery/performance profiling on mobile devices

### 7.3 Refinement
- [ ] Iterate on portal designs based on user feedback
- [ ] Optimize reasoning trace depth and default expansion states
- [ ] Fine-tune animation timings and easing curves
- [ ] Polish edge cases and error messaging
- [ ] Documentation and inline help system

---

## Technical Stack Summary

### Frontend
- **Framework:** React + TypeScript + Vite ✅ IMPLEMENTED
- **UI Library:** shadcn/ui components (extended with custom Frutiger Aero styling) ✅ BASIC IMPLEMENTATION
- **Styling:** Tailwind CSS with custom config ✅ IMPLEMENTED
- **IDE:** VS Code for development, Lovable for UI prompting/fixes ✅ IN USE

### APIs & Services
- **AI:** Lovable AI Gateway (google/gemini-2.5-flash) ✅ IMPLEMENTED
  - Intent parsing via `parse-route-intent` edge function
  - Reasoning generation via `generate-reasoning` edge function
  - No user API key required (auto-provisioned LOVABLE_API_KEY)
- **Maps:** Google Maps Directions API, Places API ✅ IMPLEMENTED
- **Bike Data:** GBFS (General Bikeshare Feed Specification) ✅ IMPLEMENTED
- **Real-time:** WebSocket for live bike station updates (FUTURE)

### Key Libraries
- **Animation:** Framer Motion or CSS animations with custom timing (PLANNED)
- **Charts:** Recharts for route comparison visualizations (if needed)
- **Syntax Highlighting:** react-syntax-highlighter for raw data display (PLANNED)
- **Icons:** Lucide React for consistent iconography ✅ IMPLEMENTED

---

## Success Metrics

### User Engagement
- Average time spent exploring reasoning traces
- Portal selection distribution (which portals are most popular)
- Multi-portal combination usage rate
- Route save/favorite rates

### AI Performance
- Intent interpretation accuracy rate
- User override frequency (indicator of reasoning quality)
- Route satisfaction scores
- Confidence score correlation with user acceptance

### Technical Performance
- Route generation time < 3 seconds ✅ CURRENTLY MEETING
- Reasoning trace render time < 500ms (NOT YET IMPLEMENTED)
- 60 FPS animation performance on mid-range devices
- API error rate < 1%

---

## Future Enhancements (Post-Launch)

- [ ] Voice input for natural language queries
- [ ] AR navigation overlay with reasoning highlights
- [ ] Community route sharing and rating
- [ ] ML-based route personalization over time
- [ ] Integration with calendar for commute prediction
- [ ] Gamification: "Museum curator" badges for exploration
- [ ] Multi-modal transportation expansion (scooters, car-sharing)
- [ ] Carbon footprint tracking and eco-routing
- [ ] Collaborative routing for group trips
- [ ] Historical route archive as "permanent exhibits"

---

## Dependencies & Risks

### Critical Path Items
1. ~~Gemini API access and quota management~~ (FUTURE PHASE)
2. Google Maps API billing setup ✅ COMPLETE
3. GBFS data reliability across different bike-share systems ✅ FUNCTIONAL
4. Mobile browser animation performance (NOT YET TESTED)

### Risk Mitigation
- **API Failures:** Implement robust fallback to cached routes and graceful degradation (IN PROGRESS)
- **Performance:** Progressive enhancement strategy, load reasoning traces on-demand (PLANNED)
- **Design Complexity:** Conduct early user testing to validate museum metaphor clarity (PLANNED)
- **Budget:** Monitor API costs closely, implement caching strategies (NEEDED)

### New Risks Identified
- **Step Ordering Bug:** Geographic sequencing issues when multiple transport modes are mixed
- **Coordinate Validation:** Missing start/end locations can break step chaining
- **Reset Functionality:** Incomplete reset from route detail view

---

**Last Updated:** October 2025  
**Project Timeline:** 14 weeks to MVP (Currently in Week 5-6)  
**Team:** Solo development with AI assistance  
**Current Focus:** Phase 3.2 - Route generation engine enhancement & Phase 4 - Results visualization
