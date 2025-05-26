from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import csv
import json
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
import logging
import numpy as np

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Kaleido for scientific publication quality
pio.kaleido.scope.default_scale = 4.17  # This gives ~300 DPI at standard sizes
pio.kaleido.scope.default_format = "png"

# Pydantic models for chart generation
class YAxisConfig(BaseModel):
    name: str
    color: str

class ChartRequest(BaseModel):
    fileData: List[dict]
    xAxis: str
    yAxes: List[YAxisConfig]
    chartType: str
    fileName: str

class ExportSettings(BaseModel):
    quality: str = "publication"
    format: str = "png"  # png, svg, pdf
    width: Optional[int] = None
    height: Optional[int] = None
    dpi: Optional[int] = None

# Scientific publication quality presets (300 DPI equivalent)
SCIENTIFIC_PRESETS = {
    "draft": {
        "width": 600, "height": 450, "scale": 2.5, "dpi_equivalent": 200,
        "font_size": 10, "title_size": 12, "axis_size": 9, "legend_size": 8,
        "line_width": 1.5, "marker_size": 4
    },
    "manuscript": {
        "width": 800, "height": 600, "scale": 3.75, "dpi_equivalent": 300,
        "font_size": 12, "title_size": 14, "axis_size": 11, "legend_size": 10,
        "line_width": 2, "marker_size": 5
    },
    "publication": {
        "width": 1200, "height": 900, "scale": 4.17, "dpi_equivalent": 300,
        "font_size": 14, "title_size": 16, "axis_size": 13, "legend_size": 12,
        "line_width": 2.5, "marker_size": 6
    },
    "high_res": {
        "width": 1600, "height": 1200, "scale": 5.0, "dpi_equivalent": 400,
        "font_size": 16, "title_size": 18, "axis_size": 15, "legend_size": 14,
        "line_width": 3, "marker_size": 7
    },
    "poster": {
        "width": 2000, "height": 1500, "scale": 6.25, "dpi_equivalent": 500,
        "font_size": 20, "title_size": 24, "axis_size": 18, "legend_size": 16,
        "line_width": 4, "marker_size": 10
    }
}

# Scientific color palettes
SCIENTIFIC_COLORS = {
    "default": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"],
    "colorblind": ["#0173b2", "#de8f05", "#029e73", "#cc78bc", "#ca9161", "#fbafe4", "#949494", "#ece133"],
    "nature": ["#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F", "#8491B4", "#91D1C2", "#DC0000"],
    "science": ["#3B4992", "#EE0000", "#008B45", "#631879", "#008280", "#BB0021", "#5F559B", "#A20056"],
    "grayscale": ["#000000", "#404040", "#808080", "#A0A0A0", "#C0C0C0", "#E0E0E0"]
}

def process_numeric_columns(df: pd.DataFrame, x_column: str) -> pd.DataFrame:
    """
    Attempts to convert all columns (except the x_column) to numeric types.
    Handles scientific notation and common data formats.
    """
    for col in df.columns:
        if col != x_column:
            try:
                # Handle scientific notation and convert to numeric
                df[col] = pd.to_numeric(df[col], errors='coerce')
                # Remove any infinite values
                df[col] = df[col].replace([np.inf, -np.inf], np.nan)
            except Exception as e:
                logger.warning(f"Could not convert column '{col}' to numeric: {e}")
    return df

def create_plotly_figure(data: List[dict], x_column: str, y_axes_config: List[YAxisConfig], 
                        chart_type: str, file_name: str, color_palette: str = "default") -> go.Figure:
    """
    Creates a scientifically styled Plotly figure from the provided data and configuration.
    """
    df = pd.DataFrame(data)
    df = process_numeric_columns(df, x_column)

    # Validate columns
    if x_column and x_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"X-axis column '{x_column}' not found in data.")

    valid_y_axes_config = []
    for axis_config in y_axes_config:
        if axis_config.name not in df.columns:
            raise HTTPException(status_code=400, detail=f"Y-axis column '{axis_config.name}' not found in data.")
        if not pd.api.types.is_numeric_dtype(df[axis_config.name]):
            logger.warning(f"Y-axis column '{axis_config.name}' is not numeric. Skipping.")
            continue
        valid_y_axes_config.append(axis_config)

    if not valid_y_axes_config:
        raise HTTPException(status_code=400, detail="No valid numeric Y-axis columns found.")

    fig = go.Figure()
    colors = SCIENTIFIC_COLORS.get(color_palette, SCIENTIFIC_COLORS["default"])

    for i, axis_config in enumerate(valid_y_axes_config):
        y_column = axis_config.name
        # Use scientific color palette if no specific color provided
        color = axis_config.color if axis_config.color != "#000000" else colors[i % len(colors)]

        x_data = df[x_column] if x_column else df.index
        y_data = df[y_column]

        # Remove any NaN values for cleaner plots
        mask = ~(pd.isna(x_data) | pd.isna(y_data))
        x_clean = x_data[mask]
        y_clean = y_data[mask]

        if chart_type == 'line':
            fig.add_trace(go.Scatter(
                x=x_clean, y=y_clean, mode='lines+markers',
                name=y_column, 
                line=dict(color=color, width=2),
                marker=dict(size=5, symbol='circle')
            ))
        elif chart_type == 'scatter':
            fig.add_trace(go.Scatter(
                x=x_clean, y=y_clean, mode='markers',
                name=y_column, 
                marker=dict(color=color, size=6, symbol='circle', 
                           line=dict(width=0.5, color='white'))
            ))
        elif chart_type == 'bar':
            fig.add_trace(go.Bar(
                x=x_clean, y=y_clean, name=y_column,
                marker_color=color,
                marker_line=dict(width=0.5, color='black')
            ))

    return fig

def apply_scientific_styling(fig: go.Figure, preset: dict, title: str, x_title: str, y_title: str):
    """
    Applies scientific publication styling to the figure.
    """
    fig.update_layout(
        # Title styling
        title=dict(
            text=title,
            font=dict(size=preset["title_size"], family="Arial, sans-serif", color="black"),
            x=0.5,
            xanchor='center',
            y=0.95,
            yanchor='top'
        ),
        
        # Overall layout
        width=preset["width"],
        height=preset["height"],
        margin=dict(l=80, r=40, t=100, b=80),
        
        # Background colors (white for publications)
        plot_bgcolor='white',
        paper_bgcolor='white',
        
        # Font settings
        font=dict(size=preset["font_size"], family="Arial, sans-serif", color="black"),
        
        # Legend styling
        showlegend=True,
        legend=dict(
            orientation="v",
            yanchor="top",
            y=0.98,
            xanchor="left",
            x=1.02,
            font=dict(size=preset["legend_size"]),
            bgcolor="rgba(255,255,255,0.8)",
            bordercolor="black",
            borderwidth=1
        )
    )

    # X-axis styling
    fig.update_xaxes(
        title=dict(text=x_title, font=dict(size=preset["axis_size"])),
        showgrid=True,
        gridwidth=0.5,
        gridcolor='lightgray',
        showline=True,
        linewidth=1.5,
        linecolor='black',
        ticks="outside",
        tickwidth=1,
        tickcolor='black',
        tickfont=dict(size=preset["font_size"]-1),
        mirror=True
    )
    
    # Y-axis styling
    fig.update_yaxes(
        title=dict(text=y_title, font=dict(size=preset["axis_size"])),
        showgrid=True,
        gridwidth=0.5,
        gridcolor='lightgray',
        showline=True,
        linewidth=1.5,
        linecolor='black',
        ticks="outside",
        tickwidth=1,
        tickcolor='black',
        tickfont=dict(size=preset["font_size"]-1),
        mirror=True,
        zeroline=True,
        zerolinewidth=1,
        zerolinecolor='black'
    )

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith(".csv"):
        try:
            text = contents.decode("utf-8")
            reader = csv.reader(text.splitlines())
            rows = list(reader)
            if not rows:
                raise HTTPException(status_code=400, detail="Empty CSV")
            columns = rows[0]
            data = [dict(zip(columns, row)) for row in rows[1:] if len(row) == len(columns)]
            return {"columns": columns, "data": data}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")

    elif filename.endswith(".json"):
        try:
            parsed = json.loads(contents)
            if isinstance(parsed, list) and parsed:
                columns = list(parsed[0].keys())
                return {"columns": columns, "data": parsed}
            elif isinstance(parsed, dict):
                columns = list(parsed.keys())
                return {"columns": columns, "data": [parsed]}
            else:
                raise HTTPException(status_code=400, detail="Invalid JSON structure")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format")

    else:
        raise HTTPException(status_code=400, detail="File must be CSV or JSON")

@app.post("/generate_chart")
async def generate_chart(
    request_body: ChartRequest,
    color_palette: str = Query("default", description="Color palette: default, colorblind, nature, science, grayscale")
):
    """
    Generates a scientifically styled Plotly figure and returns its JSON representation for display.
    """
    logger.info(f"Generating scientific chart for {request_body.fileName}")
    
    fig = create_plotly_figure(
        request_body.fileData, 
        request_body.xAxis, 
        request_body.yAxes, 
        request_body.chartType, 
        request_body.fileName,
        color_palette
    )

    # Apply basic scientific styling for preview
    preset = SCIENTIFIC_PRESETS["manuscript"]
    title = f'{request_body.fileName.replace(".csv", "").replace(".json", "")}'
    x_title = request_body.xAxis if request_body.xAxis else 'Index'
    y_title = 'Value'
    
    apply_scientific_styling(fig, preset, title, x_title, y_title)

    try:
        chart_json = fig.to_json()
        return Response(
            content=json.dumps({"chartData": chart_json}), 
            media_type="application/json"
        )
    except Exception as e:
        logger.error(f"Error converting figure to JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating chart: {e}")

@app.post("/export_chart")
async def export_chart(
    request_body: ChartRequest,
    quality: str = Query("publication", description="Quality preset: draft, manuscript, publication, high_res, poster"),
    format: str = Query("png", description="Export format: png, svg, pdf"),
    color_palette: str = Query("default", description="Color palette: default, colorblind, nature, science, grayscale"),
    custom_width: Optional[int] = Query(None, description="Custom width in pixels"),
    custom_height: Optional[int] = Query(None, description="Custom height in pixels"),
    custom_dpi: Optional[int] = Query(None, description="Custom DPI (will calculate appropriate scale)")
):
    """
    Exports a chart as publication-ready image with scientific styling and proper DPI.
    """
    logger.info(f"Exporting scientific chart for {request_body.fileName} with quality: {quality}")
    
    # Get quality preset
    if quality not in SCIENTIFIC_PRESETS:
        raise HTTPException(status_code=400, detail=f"Invalid quality preset. Choose from: {list(SCIENTIFIC_PRESETS.keys())}")
    
    preset = SCIENTIFIC_PRESETS[quality].copy()
    
    # Override with custom values if provided
    if custom_width:
        preset["width"] = custom_width
    if custom_height:
        preset["height"] = custom_height
    if custom_dpi:
        # Calculate scale factor for desired DPI (assuming 72 DPI base)
        preset["scale"] = custom_dpi / 72.0
        preset["dpi_equivalent"] = custom_dpi
    
    # Validate parameters
    if preset["scale"] < 1.0 or preset["scale"] > 10.0:
        raise HTTPException(status_code=400, detail="Scale must be between 1.0 and 10.0")
    if preset["width"] < 400 or preset["width"] > 4000:
        raise HTTPException(status_code=400, detail="Width must be between 400 and 4000 pixels")
    if preset["height"] < 300 or preset["height"] > 3000:
        raise HTTPException(status_code=400, detail="Height must be between 300 and 3000 pixels")

    fig = create_plotly_figure(
        request_body.fileData, 
        request_body.xAxis, 
        request_body.yAxes, 
        request_body.chartType, 
        request_body.fileName,
        color_palette
    )

    # Apply scientific styling
    title = f'{request_body.fileName.replace(".csv", "").replace(".json", "")}'
    x_title = request_body.xAxis if request_body.xAxis else 'Index'
    y_title = 'Value'
    
    apply_scientific_styling(fig, preset, title, x_title, y_title)

    try:
        # Generate publication-quality image
        if format.lower() == "svg":
            img_content = pio.to_image(fig, format="svg", width=preset["width"], height=preset["height"])
            media_type = "image/svg+xml"
            file_extension = "svg"
        elif format.lower() == "pdf":
            img_content = pio.to_image(fig, format="pdf", width=preset["width"], height=preset["height"])
            media_type = "application/pdf"
            file_extension = "pdf"
        else:  # PNG
            img_content = pio.to_image(fig, format="png", scale=preset["scale"], 
                                     width=preset["width"], height=preset["height"])
            media_type = "image/png"
            file_extension = "png"
        
        # Create descriptive filename
        base_name = request_body.fileName.replace('.csv', '').replace('.json', '')
        dpi_info = f"{preset['dpi_equivalent']}dpi" if 'dpi_equivalent' in preset else f"{preset['scale']}x"
        filename = f"{base_name}_{quality}_{dpi_info}_{preset['width']}x{preset['height']}.{file_extension}"
        
        return Response(
            content=img_content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "X-Chart-Quality": quality,
                "X-Chart-DPI": str(preset.get('dpi_equivalent', 'N/A')),
                "X-Chart-Dimensions": f"{preset['width']}x{preset['height']}",
                "X-Chart-Scale": str(preset['scale']),
                "X-Color-Palette": color_palette
            }
        )
    except Exception as e:
        logger.error(f"Error exporting scientific chart: {e}")
        raise HTTPException(status_code=500, detail=f"Error exporting chart: {e}")

@app.get("/quality_presets")
async def get_quality_presets():
    """
    Returns available scientific quality presets and their specifications.
    """
    return {
        "presets": SCIENTIFIC_PRESETS,
        "color_palettes": SCIENTIFIC_COLORS,
        "description": {
            "draft": "Draft quality for initial review (200 DPI equivalent)",
            "manuscript": "Manuscript submission quality (300 DPI)",
            "publication": "Publication ready quality (300 DPI, optimized)",
            "high_res": "High resolution for detailed analysis (400 DPI)",
            "poster": "Poster presentation quality (500 DPI)"
        },
        "formats": ["png", "svg", "pdf"],
        "recommended_dpi": {
            "web_display": 150,
            "manuscript": 300,
            "print_publication": 300,
            "poster": 500,
            "high_resolution": 600
        }
    }

@app.get("/color_palettes")
async def get_color_palettes():
    """
    Returns available scientific color palettes.
    """
    return {
        "palettes": SCIENTIFIC_COLORS,
        "descriptions": {
            "default": "Standard Plotly colors",
            "colorblind": "Colorblind-friendly palette",
            "nature": "Nature journal inspired colors",
            "science": "Science journal inspired colors", 
            "grayscale": "Grayscale for B&W publications"
        },
        "recommendations": {
            "general_scientific": "colorblind",
            "nature_journals": "nature",
            "science_journals": "science",
            "medical_papers": "colorblind",
            "bw_publications": "grayscale"
        }
    }