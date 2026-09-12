//
//  StickerModel.swift
//  DuetPhotobooth
//

import SwiftUI

public enum StickerType: String, CaseIterable, Identifiable, Codable {
    case heart = "heart"
    case star = "star"
    case note = "note"
    case arrow = "arrow"
    case tape = "tape"
    case xoxo = "xoxo"
    
    public var id: String { rawValue }
    
    public var label: String {
        switch self {
        case .heart: return "Heart"
        case .star: return "Star"
        case .note: return "Note"
        case .arrow: return "Arrow"
        case .tape: return "Tape"
        case .xoxo: return "XOXO"
        }
    }
}

public struct StickerInstance: Identifiable, Codable, Equatable {
    public let id: String
    public let type: StickerType
    public var x: CGFloat // normalized 0.0 ... 1.0
    public var y: CGFloat // normalized 0.0 ... 1.0
    public var rotation: Double // degrees
    
    public init(id: String = UUID().uuidString, type: StickerType, x: CGFloat, y: CGFloat, rotation: Double = 0.0) {
        self.id = id
        self.type = type
        self.x = x
        self.y = y
        self.rotation = rotation
    }
}

// SwiftUI Sticker View Renderer
public struct StickerItemView: View {
    public let type: StickerType
    public var size: CGFloat = 36
    
    public init(type: StickerType, size: CGFloat = 36) {
        self.type = type
        self.size = size
    }
    
    public var body: some View {
        Group {
            switch type {
            case .heart:
                Image(systemName: "heart.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.red)
                    .shadow(color: DuetTheme.ink.opacity(0.2), radius: 1, x: 0, y: 1)
            case .star:
                Image(systemName: "sparkle")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.red)
            case .note:
                ZStack {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(DuetTheme.paperHi)
                        .overlay(
                            RoundedRectangle(cornerRadius: 3)
                                .stroke(DuetTheme.ink, lineWidth: 1)
                        )
                    VStack(spacing: 3) {
                        Rectangle().fill(DuetTheme.ink.opacity(0.6)).frame(height: 1.2)
                        Rectangle().fill(DuetTheme.ink.opacity(0.6)).frame(height: 1.2)
                        Rectangle().fill(DuetTheme.ink.opacity(0.6)).frame(height: 1.2)
                    }
                    .padding(4)
                }
            case .arrow:
                Image(systemName: "arrow.up.right")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.red)
            case .tape:
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(white: 0.94, opacity: 0.82))
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(Color.black.opacity(0.25), style: StrokeStyle(lineWidth: 1, dash: [4, 2]))
                    )
                    .frame(height: size * 0.45)
            case .xoxo:
                Text("xoxo")
                    .font(DuetTheme.handwritten(size: size * 0.75, weight: .bold))
                    .foregroundColor(DuetTheme.red)
            }
        }
        .frame(width: size, height: size)
    }
}
