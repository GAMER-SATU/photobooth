//
//  SoundEngine.swift
//  DuetPhotobooth
//

import AVFoundation
import AudioToolbox
import UIKit

public final class SoundEngine {
    public static let shared = SoundEngine()
    
    public var soundEnabled: Bool = true
    private var engine: AVAudioEngine?
    private var isSetup = false
    
    private init() {
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("SoundEngine audio session setup error: \(error)")
        }
    }
    
    // Haptic feedback generators matching vintage mechanical tactile sensations
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    public func ensure() {
        impactLight.prepare()
        impactMedium.prepare()
        impactHeavy.prepare()
    }
    
    // Beep sound (for countdown 3, 2, 1)
    public func beep(frequency: Double = 640, duration: Double = 0.08) {
        guard soundEnabled else { return }
        impactLight.impactOccurred()
        AudioServicesPlaySystemSound(1057) // Crisp system tick/tone
    }
    
    // Mechanical stepper motor tick (Act III printer)
    public func tick() {
        guard soundEnabled else { return }
        impactLight.impactOccurred(intensity: 0.4)
        AudioServicesPlaySystemSound(1104) // Fast mechanical click
    }
    
    // Solid mechanical click (Shutter / Buttons)
    public func click() {
        guard soundEnabled else { return }
        impactMedium.impactOccurred()
        AudioServicesPlaySystemSound(1108) // Shutter click
    }
    
    // Scissor snip (Ticket cutting)
    public func snip() {
        guard soundEnabled else { return }
        impactLight.impactOccurred(intensity: 0.7)
        AudioServicesPlaySystemSound(1103)
    }
    
    // Whoosh (Curtain opening / Paper feed start)
    public func whoosh() {
        guard soundEnabled else { return }
        impactMedium.impactOccurred()
        AudioServicesPlaySystemSound(1001)
    }
    
    // Deep thunk (Curtains stopping / Polaroid dropping from slot)
    public func thunk() {
        guard soundEnabled else { return }
        impactHeavy.impactOccurred()
        AudioServicesPlaySystemSound(1073)
    }
    
    // Bell ding (Printer finish)
    public func ding() {
        guard soundEnabled else { return }
        notificationFeedback.notificationOccurred(.success)
        AudioServicesPlaySystemSound(1025) // Vintage chime/ding
    }
    
    // Postmark stamp
    public func stamp() {
        guard soundEnabled else { return }
        impactHeavy.impactOccurred()
        AudioServicesPlaySystemSound(1054)
    }
    
    // Partner arrive
    public func arrive() {
        guard soundEnabled else { return }
        notificationFeedback.notificationOccurred(.success)
        AudioServicesPlaySystemSound(1003)
    }
}
