"""
PDF Service — Converts uploaded PDFs/images to high-resolution images for AI processing.
Uses PyMuPDF for PDF rendering and Pillow for image handling.
"""
import io
import base64
from typing import List, Tuple

import fitz  # PyMuPDF
from PIL import Image


def convert_to_images(file_bytes: bytes, filename: str) -> Tuple[List[str], int]:
    """
    Convert an uploaded file (PDF or image) to a list of base64-encoded PNG images.
    
    Args:
        file_bytes: Raw file bytes
        filename: Original filename (used to detect file type)
        
    Returns:
        Tuple of (list of base64-encoded PNG strings, page count)
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    
    if ext == "pdf":
        return _convert_pdf(file_bytes)
    elif ext in ("png", "jpg", "jpeg", "webp"):
        return _convert_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def _convert_pdf(pdf_bytes: bytes) -> Tuple[List[str], int]:
    """Convert each PDF page to a high-resolution PNG image."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images_b64 = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # 2x zoom for high quality OCR (approximately 144 DPI)
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        encoded = base64.b64encode(img_bytes).decode("utf-8")
        images_b64.append(encoded)
    
    page_count = len(doc)
    doc.close()
    return images_b64, page_count


def _convert_image(img_bytes: bytes) -> Tuple[List[str], int]:
    """Convert a single image file to a base64-encoded PNG."""
    img = Image.open(io.BytesIO(img_bytes))
    
    # Convert to RGB if necessary (handles RGBA, palette modes, etc.)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    
    # Resize if too large (keep under 4096px on longest side for Gemini)
    max_dim = 4096
    if max(img.size) > max_dim:
        ratio = max_dim / max(img.size)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    return [encoded], 1


def get_image_bytes_from_b64(b64_string: str) -> bytes:
    """Decode a base64 string back to raw image bytes."""
    return base64.b64decode(b64_string)
