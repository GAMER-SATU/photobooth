//
//  StripRenderer.swift
//  DuetPhotobooth
//

import UIKit
import CoreGraphics

public final class StripRenderer {
    public static let shared = StripRenderer()
    
    // Renders a high-resolution 300 DPI vintage photobooth strip
    public func renderStrip(
        photos: [PhotoModel],
        filter: FilterType,
        roomCode: String,
        mode: SessionMode
    ) -> UIImage {
        let scale: CGFloat = 2.0
        let stripWidth: CGFloat = 360 * scale // 720 px
        let padding: CGFloat = 20 * scale
        let photoWidth = stripWidth - 2 * padding
        let photoHeight = round(photoWidth * (540.0 / 960.0)) // 16:9 ratio
        let captionHeight: CGFloat = 40 * scale
        let headerHeight: CGFloat = 36 * scale
        let footerHeight: CGFloat = 32 * scale
        let gap: CGFloat = 16 * scale
        
        let totalHeight = headerHeight + CGFloat(photos.count) * (photoHeight + captionHeight + gap) + footerHeight + 16 * scale
        let stripSize = CGSize(width: stripWidth, height: totalHeight)
        
        let renderer = UIGraphicsImageRenderer(size: stripSize)
        return renderer.image { ctx in
            let cg = ctx.cgContext
            
            // 1. Off-white cream paper background
            cg.setFillColor(UIColor(red: 0xFF/255.0, green: 0xFE/255.0, blue: 0xFA/255.0, alpha: 1.0).cgColor)
            cg.fill(CGRect(origin: .zero, size: stripSize))
            
            // 2. Paper inner stroke border
            cg.setStrokeColor(UIColor(red: 0x37/255.0, green: 0x35/255.0, blue: 0x30/255.0, alpha: 0.25).cgColor)
            cg.setLineWidth(1.5 * scale)
            cg.stroke(CGRect(x: 1, y: 1, width: stripWidth - 2, height: totalHeight - 2))
            
            // 3. Header bar: DUET or SOLO ... STAR ... PHOTO BOOTH
            let isSolo = mode == .solo || roomCode.hasPrefix("SOLO")
            let titleText = isSolo ? "SOLO" : "DUET"
            
            let headerAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 13 * scale, weight: .bold),
                .foregroundColor: UIColor(red: 0x32/255.0, green: 0x30/255.0, blue: 0x2B/255.0, alpha: 1.0),
                .kern: 1.5 * scale
            ]
            
            (titleText as NSString).draw(at: CGPoint(x: padding, y: padding * 0.8), withAttributes: headerAttrs)
            
            let boothText = "PHOTO BOOTH"
            let boothSize = (boothText as NSString).size(withAttributes: headerAttrs)
            (boothText as NSString).draw(at: CGPoint(x: stripWidth - padding - boothSize.width, y: padding * 0.8), withAttributes: headerAttrs)
            
            // Draw center red 4-point star emblem
            drawStar(in: cg, center: CGPoint(x: stripWidth / 2, y: padding * 0.8 + 8 * scale), radius: 6 * scale)
            
            // 4. Draw each photo frame + stickers + caption
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .medium
            let dateStr = dateFormatter.string(from: Date()).uppercased()
            
            for (index, photo) in photos.enumerated() {
                let y = headerHeight + CGFloat(index) * (photoHeight + captionHeight + gap)
                let photoRect = CGRect(x: padding, y: y, width: photoWidth, height: photoHeight)
                
                // Draw photo image with filter applied
                let filteredImg = photo.filter.apply(to: photo.image)
                filteredImg.draw(in: photoRect)
                
                // Photo thin outline
                cg.setStrokeColor(UIColor(white: 0.2, alpha: 0.15).cgColor)
                cg.setLineWidth(1)
                cg.stroke(photoRect)
                
                // Draw stickers on this photo
                for sticker in photo.stickers {
                    let sx = photoRect.minX + sticker.x * photoWidth
                    let sy = photoRect.minY + sticker.y * photoHeight
                    let sSize = photoWidth * 0.085
                    
                    cg.saveGState()
                    cg.translateBy(x: sx, y: sy)
                    cg.rotate(by: CGFloat(sticker.rotation * .pi / 180.0))
                    drawSticker(type: sticker.type, in: cg, size: sSize)
                    cg.restoreGState()
                }
                
                // Draw handwritten caption underneath photo
                if !photo.caption.isEmpty {
                    let capAttrs: [NSAttributedString.Key: Any] = [
                        .font: UIFont(name: "Snell Roundhand", size: 18 * scale) ?? UIFont.systemFont(ofSize: 18 * scale, weight: .medium),
                        .foregroundColor: UIColor(red: 0x38/255.0, green: 0x35/255.0, blue: 0x2F/255.0, alpha: 1.0)
                    ]
                    let capStr = photo.caption as NSString
                    let capSize = capStr.size(withAttributes: capAttrs)
                    capStr.draw(
                        at: CGPoint(x: (stripWidth - capSize.width) / 2, y: y + photoHeight + 8 * scale),
                        withAttributes: capAttrs
                    )
                }
            }
            
            // 5. Footer: PHOTO BOOTH · DATE · TONE · ROOM
            let sessionLabel = isSolo ? "SOLO SESSION" : "ROOM \(roomCode)"
            let footerText = "PHOTO BOOTH · \(dateStr) · TONE \(filter.displayName) · \(sessionLabel)"
            let footAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 9 * scale, weight: .regular),
                .foregroundColor: UIColor(red: 0x7A/255.0, green: 0x76/255.0, blue: 0x6D/255.0, alpha: 1.0),
                .kern: 0.8 * scale
            ]
            let footSize = (footerText as NSString).size(withAttributes: footAttrs)
            (footerText as NSString).draw(
                at: CGPoint(x: (stripWidth - footSize.width) / 2, y: totalHeight - footerHeight + 4 * scale),
                withAttributes: footAttrs
            )
        }
    }
    
    // Procedural red star drawing
    private func drawStar(in ctx: CGContext, center: CGPoint, radius: CGFloat) {
        ctx.saveGState()
        ctx.setFillColor(UIColor(red: 0xC1/255.0, green: 0x3A/255.0, blue: 0x2E/255.0, alpha: 1.0).cgColor)
        ctx.beginPath()
        ctx.move(to: CGPoint(x: center.x, y: center.y - radius))
        ctx.addQuadCurve(to: CGPoint(x: center.x + radius, y: center.y), control: center)
        ctx.addQuadCurve(to: CGPoint(x: center.x, y: center.y + radius), control: center)
        ctx.addQuadCurve(to: CGPoint(x: center.x - radius, y: center.y), control: center)
        ctx.addQuadCurve(to: CGPoint(x: center.x, y: center.y - radius), control: center)
        ctx.closePath()
        ctx.fillPath()
        ctx.restoreGState()
    }
    
    // Procedural sticker icon drawing for high-res rasterization
    private func drawSticker(type: StickerType, in ctx: CGContext, size: CGFloat) {
        let rect = CGRect(x: -size / 2, y: -size / 2, width: size, height: size)
        
        switch type {
        case .heart:
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 0, y: size * 0.4))
            path.addCurve(to: CGPoint(x: -size * 0.45, y: -size * 0.2), controlPoint1: CGPoint(x: -size * 0.45, y: size * 0.1), controlPoint2: CGPoint(x: -size * 0.45, y: -size * 0.1))
            path.addCurve(to: CGPoint(x: 0, y: -size * 0.05), controlPoint1: CGPoint(x: -size * 0.2, y: -size * 0.35), controlPoint2: CGPoint(x: 0, y: -size * 0.2))
            path.addCurve(to: CGPoint(x: size * 0.45, y: -size * 0.2), controlPoint1: CGPoint(x: 0, y: -size * 0.2), controlPoint2: CGPoint(x: size * 0.2, y: -size * 0.35))
            path.addCurve(to: CGPoint(x: 0, y: size * 0.4), controlPoint1: CGPoint(x: size * 0.45, y: -size * 0.1), controlPoint2: CGPoint(x: size * 0.45, y: size * 0.1))
            path.close()
            
            ctx.setFillColor(UIColor(red: 0xC1/255.0, green: 0x3A/255.0, blue: 0x2E/255.0, alpha: 1.0).cgColor)
            path.fill()
            
        case .star:
            drawStar(in: ctx, center: .zero, radius: size * 0.45)
            
        case .note:
            let w = size * 1.5, h = size * 1.1
            let r = CGRect(x: -w/2, y: -h/2, width: w, height: h)
            ctx.setFillColor(UIColor(red: 0xF8/255.0, green: 0xF3/255.0, blue: 0xE6/255.0, alpha: 1.0).cgColor)
            ctx.fill(r)
            ctx.setStrokeColor(UIColor(red: 0x3A/255.0, green: 0x36/255.0, blue: 0x2F/255.0, alpha: 1.0).cgColor)
            ctx.setLineWidth(1.5)
            ctx.stroke(r)
            
        case .arrow:
            ctx.setStrokeColor(UIColor(red: 0xC1/255.0, green: 0x3A/255.0, blue: 0x2E/255.0, alpha: 1.0).cgColor)
            ctx.setLineWidth(2.2)
            ctx.beginPath()
            ctx.move(to: CGPoint(x: -size * 0.4, y: size * 0.4))
            ctx.addLine(to: CGPoint(x: size * 0.4, y: -size * 0.4))
            ctx.addLine(to: CGPoint(x: size * 0.1, y: -size * 0.4))
            ctx.move(to: CGPoint(x: size * 0.4, y: -size * 0.4))
            ctx.addLine(to: CGPoint(x: size * 0.4, y: -size * 0.1))
            ctx.strokePath()
            
        case .tape:
            let w = size * 1.8, h = size * 0.7
            let r = CGRect(x: -w/2, y: -h/2, width: w, height: h)
            ctx.setFillColor(UIColor(white: 0.94, alpha: 0.85).cgColor)
            ctx.fill(r)
            ctx.setStrokeColor(UIColor(white: 0.3, alpha: 0.3).cgColor)
            ctx.setLineWidth(1)
            ctx.stroke(r)
            
        case .xoxo:
            let str = "xoxo" as NSString
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: size * 0.7),
                .foregroundColor: UIColor(red: 0xC1/255.0, green: 0x3A/255.0, blue: 0x2E/255.0, alpha: 1.0)
            ]
            let s = str.size(withAttributes: attrs)
            str.draw(at: CGPoint(x: -s.width/2, y: -s.height/2), withAttributes: attrs)
        }
    }
}
