# FridgePolice - Engineering Design & Scenario Fixes

## Overview
FridgePolice is a prototype built using React to track shared fridge inventory and manage usage requests while preventing human edge-case failures.

## Implementation Details for Required Scenarios

### 1. Scenario 1: Concurrency Collision
- **Issue:** Two users requesting the final 25% slice simultaneously leads to double-allocation.
- **Solution:** Implemented atomic state mutation locks (`isLocked`) and strict inventory pre-validation. If the remaining quantity is less than requested, subsequent concurrent actions are blocked and logged.

### 2. Scenario 2: The Spoilage Ghost (Stale State)
- **Issue:** Food approved for consumption is forgotten, spoils, and blocks cost splits indefinitely.
- **Solution:** Implemented a timestamp-based expiration threshold (24 hours). An explicit expiration handler (`cleanupStaleApprovals`) transition states from `approved` to `expired_spoiled`, preventing stale approvals from persisting forever.

### 3. Scenario 3: The Identical Item Bug
- **Issue:** Multiple identical physical items (e.g., two Heinz Ketchup bottles) cause tracking ambiguity.
- **Solution:** Assigned immutable unique identifiers (`item-101`, `item-102`) to every registered item regardless of display name, isolating inventory updates to the exact physical bottle.

### 4. Scenario 4: The Phantom Eater (Reality Desync)
- **Issue:** Food consumed without app interaction causes permanent state mismatch between digital logs and physical reality.
- **Solution:** Provided a high-priority "Report Consumed/Empty" manual override function (`handleManualOverride`), allowing users to immediately reconcile digital inventory with physical truth.