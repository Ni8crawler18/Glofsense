# DEM Water Flow Simulation - Technical Implementation

This document explains the technical implementation of the DEM Water Flow Simulation for GLOF (Glacial Lake Outburst Flood) events.

## Core Implementation

### Data Processing

1. **DEM Loading and Preprocessing**
   - The GeoTIFF DEM is loaded using `rasterio`
   - Downsampling is applied using slice notation `dem_data[::downscale_factor, ::downscale_factor]` to reduce computation load
   - Gaussian smoothing (`gaussian_filter`) is applied to reduce terrain noise
   - NaN values are replaced with minimum elevation using `np.nan_to_num()` to ensure continuous calculations

2. **Water Level Threshold**
   - The water level is set as a percentile of the DEM height using `np.nanpercentile()`
   - This threshold represents the boundary between submerged and exposed terrain

### Water Flow Simulation

1. **Binary Morphological Approach**
   - The core algorithm uses binary morphological operations to simulate water flow
   - Water state is stored as a binary array where 1 represents water presence and 0 represents dry terrain
   - `binary_dilation` is used to expand water to neighboring cells in each iteration
   - Water expansion is constrained to elevations below the threshold

2. **Flow Constraints**
   - Water can only flow to cells with elevation ≤ threshold
   - This is implemented using the logical AND operation: `dilated_water & (dem_smoothed_filled <= threshold)`
   - This enforces the downhill flow behavior

3. **Stagnation Prevention**
   - To prevent water from becoming static, a randomized perturbation mechanism is implemented
   - When no change is detected between frames, random expansion points are created
   - This simulates natural variability in flow patterns

### Preventing Broadcasting Errors

The broadcasting error is fixed by:
1. Calculating water depth using a zero-initialized array and explicit indexing:
```python
water_mask = water_state > 0
water_depths = np.zeros_like(dem_smoothed_filled)
water_depths[water_mask] = threshold - dem_smoothed_filled[water_mask]
```

2. This ensures that arrays used in calculations always have compatible shapes

### Metrics Calculation

1. **Water Coverage**
   - Calculated as `sum(water_mask) * cell_area`
   - Represents the total area covered by water

2. **Water Volume**
   - First, water depth is calculated as difference between water level and terrain
   - Then volume is calculated as `sum(water_depths) * cell_area`
   - Only positive depths are considered using `np.maximum(water_depths, 0)`

3. **Maximum Depth**
   - Determined as `np.max(water_depths)` with a check for empty water array

4. **Flow Velocity Estimation**
   - Calculated by comparing water state between consecutive frames
   - Formula: `changed_cells / total_water_cells * flow_speed`
   - This provides a relative measure of flow velocity

## Visualization

1. **3D Surface Rendering**
   - Two surface layers are created using Plotly:
     - Terrain surface with Earth colorscale
     - Water surface with Blues colorscale

2. **Water Surface Representation**
   - Water is visualized as a flat surface at the threshold height
   - Only created where water is present using conditional indexing
   - Semi-transparency is applied to show submerged terrain

3. **Rendering Optimization**
   - `uirevision='constant'` maintains camera position between frames
   - Complete figure is recreated for each frame to ensure clean updates

## Session State Management

Streamlit's session state is used to maintain persistence between reruns:
- `water_state`: Current water distribution
- `threshold`: Current water level threshold
- `animation_running`: Controls the simulation loop
- `frame_count`: Tracks the current frame number

This implementation effectively simulates water flow dynamics across a DEM for visualizing GLOF events while maintaining computational efficiency.