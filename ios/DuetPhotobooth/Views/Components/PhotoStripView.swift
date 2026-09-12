//
//  PhotoStripView.swift
//  DuetPhotobooth
//
//  Visual photobooth strip with paper grain, frame borders,
//  handwritten captions, stickers, and chemical development emulsion effect.
//

import SwiftUI

struct PhotoStripView: View {
    let photos: [PhotoModel]
    let mode: SessionMode
    let roomCode: String
    var developmentProgress: Double? = nil // nil means fully developed
    
    var body: some View {
        VStack(spacing: 16) {
            // Header star
            HStack {
                Spacer()
                Text("★ ★ ★")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(DuetTheme.inkLight.opacity(0.6))
                    .tracking(6)
                Spacer()
            }
            .padding(.top, 14)
            
            // 3 Photo Frames
            ForEach(0..<3, id: \.self) { index in
                VStack(spacing: 6) {
                    // Photo Frame Box
                    ZStack {
                        // Background if no photo yet
                        Rectangle()
                            .fill(DuetTheme.paperHi)
                            .aspectRatio(16/9, contentMode: .fit)
                        
                        if index < photos.count {
                            let photo = photos[index]
                            Image(uiImage: photo.image)
                                .resizable()
                                .scaledToFill()
                                .clipped()
                            
                            // Stickers
                            ForEach(photo.stickers) { sticker in
                                StickerItemView(type: sticker.type)
                                    .scaleEffect(sticker.scale)
                                    .rotationEffect(sticker.rotation)
                                    .position(
                                        x: sticker.position.x * 280,
                                        y: sticker.position.y * (280 * 9 / 16)
                                    )
                            }
                            
                            // Photochemical Development Emulsion Overlay
                            if let progress = developmentProgress {
                                let frameThreshold = Double(index) / 3.0
                                let frameProgress = max(0.0, min(1.0, (progress - frameThreshold) * 3.0))
                                let opacity = 1.0 - frameProgress
                                
                                if opacity > 0.01 {
                                    ZStack {
                                        Color(red: 0.12, green: 0.13, blue: 0.15)
                                            .opacity(opacity * 0.92)
                                        
                                        // Milky chemical gradient
                                        LinearGradient(
                                            gradient: Gradient(colors: [
                                                Color.blue.opacity(0.18),
                                                Color.white.opacity(0.12),
                                                Color.black.opacity(0.25)
                                            ]),
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                        .opacity(opacity)
                                        
                                        if frameProgress < 0.6 {
                                            Text("DEVELOPING...")
                                                .font(DuetTheme.codeFont(size: 9))
                                                .foregroundColor(.white.opacity(0.6))
                                                .tracking(2.0)
                                        }
                                    }
                                }
                            }
                        } else {
                            // Blank pending shot slot
                            VStack(spacing: 4) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 16))
                                    .foregroundColor(DuetTheme.inkLight.opacity(0.4))
                                Text("FRAME \(index + 1)")
                                    .font(DuetTheme.codeFont(size: 9))
                                    .foregroundColor(DuetTheme.inkLight.opacity(0.5))
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .aspectRatio(16/9, contentMode: .fit)
                    .overlay(
                        Rectangle()
                            .stroke(DuetTheme.ink.opacity(0.15), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.08), radius: 2, x: 0, y: 1)
                    
                    // Caption under photo
                    if index < photos.count && !photos[index].caption.isEmpty {
                        Text(photos[index].caption)
                            .font(DuetTheme.handwritingFont(size: 14))
                            .foregroundColor(DuetTheme.ink)
                            .lineLimit(1)
                            .padding(.top, 2)
                    } else {
                        // Empty spacer preserving alignment
                        Text(" ")
                            .font(DuetTheme.handwritingFont(size: 14))
                            .lineLimit(1)
                    }
                }
            }
            
            // Bottom Strip Details & Branding
            VStack(spacing: 4) {
                Divider()
                    .background(DuetTheme.inkLight.opacity(0.2))
                    .padding(.horizontal, 8)
                
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(mode == .solo ? "SOLO PHOTOBOOTH" : "DUET PHOTOBOOTH")
                            .font(DuetTheme.headlineFont(size: 10))
                            .tracking(1.8)
                            .foregroundColor(DuetTheme.ink)
                        
                        Text("Nº \(roomCode)")
                            .font(DuetTheme.codeFont(size: 8))
                            .foregroundColor(DuetTheme.inkLight)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formattedCurrentDate())
                            .font(DuetTheme.codeFont(size: 8))
                            .foregroundColor(DuetTheme.inkLight)
                        
                        Text("AUTHENTIC CHEMICAL PRINT")
                            .font(.system(size: 7, weight: .bold))
                            .tracking(0.5)
                            .foregroundColor(DuetTheme.crimson.opacity(0.7))
                    }
                }
                .padding(.horizontal, 10)
                .padding(.bottom, 14)
            }
        }
        .padding(.horizontal, 14)
        .background(
            ZStack {
                DuetTheme.paper
                // Paper edge vignette
                RoundedRectangle(cornerRadius: 3)
                    .stroke(DuetTheme.ink.opacity(0.12), lineWidth: 1)
            }
        )
        .cornerRadius(3)
        .shadow(color: Color.black.opacity(0.35), radius: 10, x: 0, y: 5)
    }
    
    private func formattedCurrentDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: Date()).uppercased()
    }
}
