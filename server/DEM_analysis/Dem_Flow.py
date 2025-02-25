import rasterio
import numpy as np
import plotly.graph_objects as go
from scipy.ndimage import gaussian_filter, binary_dilation, generate_binary_structure
import streamlit as st
import time

# Streamlit app title
st.title("DEM Water Flow Simulation for GLOF Outbreaks")

# Initialize session state
if 'animation_running' not in st.session_state:
    st.session_state.animation_running = False
if 'frame_count' not in st.session_state:
    st.session_state.frame_count = 0
if 'water_state' not in st.session_state:
    st.session_state.water_state = None
if 'threshold' not in st.session_state:
    st.session_state.threshold = None
if 'metrics_data' not in st.session_state:
    st.session_state.metrics_data = {"coverage": [], "volume": [], "max_depth": [], "velocity": []}
if 'fig' not in st.session_state:
    st.session_state.fig = None

# Sidebar controls
dem_file = st.sidebar.file_uploader("Upload DEM GeoTIFF file:", type=["tif", "tiff"])
downscale_factor = st.sidebar.slider("Downscaling Factor:", 1, 10, 5)
water_level = st.sidebar.slider("Initial Water Level (% of max height):", 1, 100, 90)
flow_speed = st.sidebar.slider("Flow Speed:", 1, 10, 5)
animation_speed = st.sidebar.slider("Frame Delay (seconds):", 0.05, 1.0, 0.1)

# Animation control
if st.sidebar.button('Toggle Animation'):
    st.session_state.animation_running = not st.session_state.animation_running
    if st.session_state.animation_running:
        st.session_state.frame_count = 0

status_text = st.sidebar.empty()

# Create separate containers for plot and metrics
plot_container = st.container()
plot_display = plot_container.empty()
metrics_container = st.container()
metrics_display = metrics_container.empty()

@st.cache_data
def load_dem(file):
    with rasterio.open(file) as src:
        data = src.read(1).astype(float)
        # Handle nodata values
        if src.nodata is not None:
            data[data == src.nodata] = np.nan
        return data

def initialize_figure():
    # Create a figure only once and store it in session state
    fig = go.Figure()
    fig.update_layout(
        scene=dict(
            aspectratio=dict(x=1, y=1, z=0.5),
            camera=dict(
                up=dict(x=0, y=0, z=1),
                center=dict(x=0, y=0, z=0),
                eye=dict(x=1.5, y=1.5, z=1.5)
            ),
            zaxis=dict(title="Elevation (m)")
        ),
        title="GLOF Water Flow Simulation",
        margin=dict(l=0, r=0, t=30, b=0),
        height=600,
        uirevision='constant'  # This keeps the view consistent between updates
    )
    return fig

def update_figure(fig, dem_data, water_state, threshold):
    # Clear existing traces
    fig.data = []
    
    # Base terrain
    fig.add_trace(go.Surface(
        z=dem_data,
        colorscale='Earth',
        showscale=False,
        opacity=0.8,
        name="Terrain"
    ))
    
    # Water surface
    water_height = np.where(water_state > 0, threshold, np.nan)
    
    fig.add_trace(go.Surface(
        z=water_height,
        surfacecolor=water_state,
        colorscale='Blues',
        showscale=False,
        opacity=0.7,
        name="Water"
    ))
    
    return fig

if dem_file is not None:
    try:
        # Load and prepare DEM data
        dem_data = load_dem(dem_file)
        dem_data = dem_data[::downscale_factor, ::downscale_factor]
        dem_smoothed = gaussian_filter(dem_data, sigma=1)
        
        # Calculate threshold based on water level percentage
        st.session_state.threshold = np.nanpercentile(dem_smoothed, water_level)
        
        # Calculate flow directions and magnitude
        dy, dx = np.gradient(-dem_smoothed)
        flow_magnitude = np.sqrt(dx**2 + dy**2)
        
        # Initialize water state if not exists
        if st.session_state.water_state is None:
            # Start with water at high elevations (above threshold)
            st.session_state.water_state = (dem_smoothed >= st.session_state.threshold).astype(float)
        
        # Initialize figure if not exists
        if st.session_state.fig is None:
            st.session_state.fig = initialize_figure()
        
        # Initial update of the figure
        fig = update_figure(st.session_state.fig, dem_smoothed, st.session_state.water_state, st.session_state.threshold)
        plot_output = plot_display.plotly_chart(fig, use_container_width=True)
        
        # Visualization loop
        while st.session_state.animation_running:
            status_text.text(f"Simulation Running - Frame {st.session_state.frame_count}")
            
            # Simulate water flow
            water_state = st.session_state.water_state.copy()
            kernel = generate_binary_structure(2, 2)
            previous_water = water_state.copy()
            
            for _ in range(flow_speed):
                # Expand water to neighbors
                water_state = binary_dilation(water_state, kernel)
                # Water can only flow to areas below the threshold
                water_state = water_state & (dem_smoothed <= st.session_state.threshold)
            
            st.session_state.water_state = water_state.astype(float)
            
            # Update figure with new water state
            fig = update_figure(st.session_state.fig, dem_smoothed, st.session_state.water_state, st.session_state.threshold)
            plot_display.plotly_chart(fig, use_container_width=True)
            
            # Calculate metrics
            # 1. Water coverage area
            cell_area = downscale_factor**2  # Simplified cell area calculation
            covered_area = np.sum(water_state) * cell_area
            
            # 2. Water volume calculation
            water_depths = np.where(water_state > 0, 
                                   st.session_state.threshold - dem_smoothed,
                                   0)
            water_depths = np.maximum(water_depths, 0)  # Ensure no negative depths
            water_volume = np.sum(water_depths) * cell_area
            
            # 3. Maximum water depth
            max_depth = np.max(water_depths) if np.any(water_state) else 0
            
            # 4. Approximate flow velocity based on change between frames
            flow_changed = np.sum(np.abs(water_state - previous_water))
            velocity_estimate = flow_changed * flow_speed / (np.sum(previous_water) + 1e-6)
            
            # Store metrics in session state
            st.session_state.metrics_data["coverage"].append(covered_area)
            st.session_state.metrics_data["volume"].append(water_volume)
            st.session_state.metrics_data["max_depth"].append(max_depth)
            st.session_state.metrics_data["velocity"].append(velocity_estimate)
            
            # Display metrics
            metrics_text = f"""
            ### Simulation Metrics (Frame {st.session_state.frame_count}):
            - Water Coverage: {covered_area:.1f} m²
            - Water Volume: {water_volume:.1f} m³
            - Maximum Water Depth: {max_depth:.2f} m
            - Relative Flow Velocity: {velocity_estimate:.4f}
            """
            metrics_display.markdown(metrics_text)
            
            # Increment frame counter
            st.session_state.frame_count += 1
            time.sleep(animation_speed)
            
        status_text.text("Simulation Stopped")
    except Exception as e:
        st.error(f"An error occurred: {e}")
        st.error(f"Error details: {type(e).__name__}")
else:
    st.info("Please upload a DEM GeoTIFF file to start the simulation")