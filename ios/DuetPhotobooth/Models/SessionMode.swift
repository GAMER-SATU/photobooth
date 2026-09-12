//
//  SessionMode.swift
//  DuetPhotobooth
//

import Foundation

public enum SessionMode: String, CaseIterable, Identifiable, Codable {
    case solo = "solo"
    case duet = "duet"
    
    public var id: String { rawValue }
    
    public var title: String {
        switch self {
        case .solo: return "SOLO BOOTH"
        case .duet: return "DUET BOOTH"
        }
    }
}

public enum PhotoboothAct: Int, CaseIterable, Comparable {
    case curtains = 1
    case booth = 2
    case printer = 3
    case memory = 4
    
    public static func < (lhs: PhotoboothAct, rhs: PhotoboothAct) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
    
    public var label: String {
        switch self {
        case .curtains: return "ACT I — THE CURTAINS"
        case .booth: return "ACT II — THE BOOTH"
        case .printer: return "ACT III — THE PRINT"
        case .memory: return "ACT IV — THE MEMORY"
        }
    }
}

public enum RoomCodeGenerator {
    public static func generate(for mode: SessionMode = .solo) -> String {
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        var code = ""
        for _ in 0..<6 {
            let idx = Int.random(in: 0..<chars.count)
            let char = chars[chars.index(chars.startIndex, offsetBy: idx)]
            code.append(char)
        }
        return mode == .solo ? "SOLO-\(code)" : code
    }
}
