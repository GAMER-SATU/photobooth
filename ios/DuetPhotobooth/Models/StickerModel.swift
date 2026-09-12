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

public struct StickerInstance: Identifiable, Equatable {
    public let id: UUID
    public let type: StickerType
    public var position: CGPoint // normalized 0.0 ... 1.0
    public var scale: CGFloat
    public var rotation: Angle
    
    // Convenience accessors
    public var x: CGFloat {
        get { position.x }
        set { position.x = newValue }
    }
    
    public var y: CGFloat {
        get { position.y }
        set { position.y = newValue }
    }
    
    public init(
        id: UUID = UUID(),
        type: StickerType,
        position: CGPoint = CGPoint(x: 0.5, y: 0.5),
        scale: CGFloat = 1.0,
        rotation: Angle = .zero
    ) {
        self.id = id
        self.type = type
        self.position = position
        self.scale = scale
        self.rotation = rotation
    }
    
    public init(id: String, type: StickerType, x: CGFloat, y: CGFloat, rotation: Double = 0.0) {
        self.id = UUID(uuidString: id) ?? UUID()
        self.type = type
        self.position = CGPoint(x: x, y: y)
        self.scale = 1.0
        self.rotation = Angle(degrees: rotation)
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
                    .frame(width: size, height: size)
                    .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                
            case .star:
                Image(systemName: "star.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.amberLamp)
                    .frame(width: size, height: size)
                    .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                
            case .note:
                Image(systemName: "music.note")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.ink)
                    .frame(width: size * 0.8, height: size)
                    .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                
            case .arrow:
                Image(systemName: "arrow.turn.right.up")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(DuetTheme.red2)
                    .frame(width: size, height: size)
                    .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                
            case .tape:
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red: 0xF0/255.0, green: 0xE8/255.0, blue: 0x90/255.0).opacity(0.6))
                    .frame(width: size * 1.5, height: size * 0.5)
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(Color.black.opacity(0.1), lineWidth: 0.5)
                    )
                
            case .xoxo:
                Text("XOXO")
                    .font(.system(size: size * 0.45, weight: .black, design: .rounded))
                    .foregroundColor(DuetTheme.crimson)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(DuetTheme.paperHi)
                            .overlay(Capsule().stroke(DuetTheme.crimson.opacity(0.4), lineWidth: 1))
                    )
            }
        }
    }
}
