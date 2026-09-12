//
//  DuetTheme.swift
//  DuetPhotobooth
//

import SwiftUI

public enum DuetTheme {
    // Colors matching the vintage photobooth aesthetic
    public static let paper = Color(red: 0xF6/255.0, green: 0xF2/255.0, blue: 0xE8/255.0)
    public static let paperHi = Color(red: 0xFD/255.0, green: 0xFB/255.0, blue: 0xF5/255.0)
    public static let paperLo = Color(red: 0xED/255.0, green: 0xE7/255.0, blue: 0xDA/255.0)
    public static let cream = Color(red: 0xFF/255.0, green: 0xFE/255.0, blue: 0xFA/255.0)
    
    public static let ink = Color(red: 0x26/255.0, green: 0x24/255.0, blue: 0x20/255.0)
    public static let ink2 = Color(red: 0x5C/255.0, green: 0x59/255.0, blue: 0x52/255.0)
    public static let ink3 = Color(red: 0x98/255.0, green: 0x94/255.0, blue: 0x8B/255.0)
    
    public static let red = Color(red: 0xC1/255.0, green: 0x3A/255.0, blue: 0x2E/255.0)
    public static let red2 = Color(red: 0xA0/255.0, green: 0x2F/255.0, blue: 0x25/255.0)
    public static let redHi = Color(red: 0xDE/255.0, green: 0x4A/255.0, blue: 0x39/255.0)
    
    public static let silverHi = Color(red: 0xE8/255.0, green: 0xEA/255.0, blue: 0xEE/255.0)
    public static let silver = Color(red: 0xCF/255.0, green: 0xD3/255.0, blue: 0xDA/255.0)
    public static let silverLo = Color(red: 0xB4/255.0, green: 0xB9/255.0, blue: 0xC1/255.0)
    public static let steel = Color(red: 0x2C/255.0, green: 0x2F/255.0, blue: 0x36/255.0)
    public static let machineDark = Color(red: 0x1A/255.0, green: 0x1B/255.0, blue: 0x1F/255.0)
    public static let amberLamp = Color(red: 0xF5/255.0, green: 0xA6/255.0, blue: 0x23/255.0)
    
    // Typography helpers
    public static func serif(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight, design: .serif)
    }
    
    public static func typewriter(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight, design: .monospaced)
    }
    
    public static func handwritten(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight, design: .rounded)
    }
    
    public static func label(size: CGFloat, weight: Font.Weight = .bold) -> Font {
        Font.system(size: size, weight: weight, design: .default)
    }
}
