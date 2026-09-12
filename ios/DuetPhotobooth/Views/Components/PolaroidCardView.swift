//
//  PolaroidCardView.swift
//  DuetPhotobooth
//
//  Interactive polaroid card on the bench allowing inline caption editing,
//  sticker drawer selection, and draggable sticker placement.
//

import SwiftUI

struct PolaroidCardView: View {
    let photoIndex: Int
    @ObservedObject var viewModel: PhotoboothViewModel
    
    @State private var selectedStickerId: UUID? = nil
    
    private var photo: PhotoModel? {
        guard photoIndex < viewModel.capturedPhotos.count else { return nil }
        return viewModel.capturedPhotos[photoIndex]
    }
    
    var body: some View {
        if let currentPhoto = photo {
            VStack(spacing: 12) {
                // Polaroid Card Body
                VStack(spacing: 10) {
                    // Photo Area with Stickers
                    GeometryReader { geo in
                        ZStack {
                            Image(uiImage: currentPhoto.image)
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .clipped()
                            
                            // Draggable / Interactive Stickers
                            ForEach(currentPhoto.stickers) { sticker in
                                InteractiveStickerView(
                                    sticker: sticker,
                                    containerSize: geo.size,
                                    isSelected: selectedStickerId == sticker.id,
                                    onSelect: {
                                        selectedStickerId = sticker.id
                                    },
                                    onUpdate: { pos, scale, rot in
                                        viewModel.updateSticker(
                                            photoIndex: photoIndex,
                                            stickerId: sticker.id,
                                            position: pos,
                                            scale: scale,
                                            rotation: rot
                                        )
                                    },
                                    onDelete: {
                                        viewModel.removeSticker(photoIndex: photoIndex, stickerId: sticker.id)
                                        if selectedStickerId == sticker.id {
                                            selectedStickerId = nil
                                        }
                                    }
                                )
                            }
                        }
                    }
                    .frame(height: 180)
                    .background(Color.black)
                    .overlay(
                        Rectangle().stroke(DuetTheme.ink.opacity(0.2), lineWidth: 1)
                    )
                    
                    // Inline Caption Field
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            TextField(
                                "write a handwritten memory...",
                                text: Binding(
                                    get: { currentPhoto.caption },
                                    set: { viewModel.updateCaption(for: photoIndex, text: $0) }
                                )
                            )
                            .font(DuetTheme.handwritingFont(size: 16))
                            .foregroundColor(DuetTheme.ink)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 6)
                            .background(
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(DuetTheme.cream.opacity(0.5))
                            )
                            
                            // Character count indicator
                            Text("\(currentPhoto.caption.count)/45")
                                .font(DuetTheme.codeFont(size: 10))
                                .foregroundColor(DuetTheme.inkLight)
                        }
                    }
                }
                .padding(14)
                .background(
                    DuetTheme.paper
                        .shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
                )
                .cornerRadius(4)
                
                // Sticker Drawer
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("ADD STICKERS")
                            .font(DuetTheme.codeFont(size: 10))
                            .foregroundColor(DuetTheme.cream.opacity(0.8))
                            .tracking(1.0)
                        
                        Spacer()
                        
                        if selectedStickerId != nil {
                            Button("Deselect") {
                                selectedStickerId = nil
                            }
                            .font(DuetTheme.codeFont(size: 10))
                            .foregroundColor(DuetTheme.amberLamp)
                        }
                    }
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(StickerType.allCases) { type in
                                Button(action: {
                                    viewModel.addSticker(to: photoIndex, type: type)
                                }) {
                                    VStack(spacing: 4) {
                                        StickerItemView(type: type)
                                            .frame(width: 32, height: 32)
                                        
                                        Text(type.label)
                                            .font(DuetTheme.codeFont(size: 8))
                                            .foregroundColor(DuetTheme.cream)
                                    }
                                    .padding(8)
                                    .background(
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(DuetTheme.machineDark)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 6)
                                                    .stroke(DuetTheme.steel.opacity(0.3), lineWidth: 1)
                                            )
                                    )
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
}

// MARK: - Interactive Sticker View
struct InteractiveStickerView: View {
    let sticker: StickerInstance
    let containerSize: CGSize
    let isSelected: Bool
    let onSelect: () -> Void
    let onUpdate: (CGPoint, CGFloat, Angle) -> Void
    let onDelete: () -> Void
    
    @State private var dragOffset: CGSize = .zero
    @State private var currentScale: CGFloat = 1.0
    @State private var currentAngle: Angle = .zero
    
    var body: some View {
        let posX = (sticker.position.x * containerSize.width) + dragOffset.width
        let posY = (sticker.position.y * containerSize.height) + dragOffset.height
        
        ZStack {
            StickerItemView(type: sticker.type)
                .scaleEffect(sticker.scale * currentScale)
                .rotationEffect(sticker.rotation + currentAngle)
                .overlay(
                    Group {
                        if isSelected {
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(DuetTheme.crimson, lineWidth: 1.5)
                                .padding(-6)
                                .overlay(
                                    Button(action: onDelete) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                            .background(Color.white.clipShape(Circle()))
                                    }
                                    .offset(x: 18, y: -18),
                                    alignment: .topTrailing
                                )
                        }
                    }
                )
                .position(x: posX, y: posY)
                .onTapGesture {
                    onSelect()
                }
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            dragOffset = value.translation
                        }
                        .onEnded { value in
                            let finalX = ((sticker.position.x * containerSize.width) + value.translation.width) / containerSize.width
                            let finalY = ((sticker.position.y * containerSize.height) + value.translation.height) / containerSize.height
                            
                            let clampedX = max(0.05, min(0.95, finalX))
                            let clampedY = max(0.05, min(0.95, finalY))
                            
                            dragOffset = .zero
                            onUpdate(CGPoint(x: clampedX, y: clampedY), sticker.scale, sticker.rotation)
                        }
                )
                .simultaneousGesture(
                    MagnificationGesture()
                        .onChanged { scale in
                            currentScale = scale
                        }
                        .onEnded { scale in
                            let finalScale = max(0.5, min(2.5, sticker.scale * scale))
                            currentScale = 1.0
                            onUpdate(sticker.position, finalScale, sticker.rotation)
                        }
                )
                .simultaneousGesture(
                    RotationGesture()
                        .onChanged { angle in
                            currentAngle = angle
                        }
                        .onEnded { angle in
                            let finalAngle = sticker.rotation + angle
                            currentAngle = .zero
                            onUpdate(sticker.position, sticker.scale, finalAngle)
                        }
                )
        }
    }
}
