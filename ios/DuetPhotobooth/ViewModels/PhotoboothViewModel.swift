//
//  PhotoboothViewModel.swift
//  DuetPhotobooth
//
//  Central state coordinator matching the Next.js Photobooth experience.
//  Coordinates Act I (Curtains), Act II (Booth), Act III (Mechanical Printer),
//  and Act IV (Memory Desk).
//

import SwiftUI
import Combine

@MainActor
final class PhotoboothViewModel: ObservableObject {
    // MARK: - Navigation & Session State
    @Published var currentAct: PhotoboothAct = .curtains
    @Published var sessionMode: SessionMode = .solo
    @Published var roomCode: String = RoomCodeGenerator.generate()
    @Published var isAudioEnabled: Bool = true {
        didSet {
            SoundEngine.shared.isEnabled = isAudioEnabled
        }
    }
    
    // MARK: - Act I State (Curtains & Tickets)
    @Published var isTearingTicket: Bool = false
    @Published var tornTicketMode: SessionMode? = nil
    
    // MARK: - Act II State (Booth Bay & Bench)
    @Published var activeFilter: FilterType = .original
    @Published var currentShotIndex: Int = 0 // 0, 1, 2
    @Published var countdownNumber: Int? = nil // 3, 2, 1
    @Published var isFlashing: Bool = false
    @Published var isCapturing: Bool = false
    @Published var capturedPhotos: [PhotoModel] = []
    @Published var activeBenchIndex: Int = 0
    
    // MARK: - Act III State (Mechanical Printer)
    @Published var printProgress: Double = 0.0 // 0.0 to 1.0
    @Published var isPrinterVibrating: Bool = false
    @Published var isMotorActive: Bool = false
    @Published var isPrintReady: Bool = false
    @Published var slotJitter: CGFloat = 0.0
    
    // MARK: - Act IV State (Memory & Export)
    @Published var renderedStripImage: UIImage? = nil
    @Published var hasDroppedMemoryPaper: Bool = false
    @Published var isPostmarkStamped: Bool = false
    @Published var saveNotificationMessage: String? = nil
    
    // Dependencies
    let cameraManager = CameraManager()
    private var printerTimer: Timer?
    private var countdownTimer: Timer?
    
    init() {
        SoundEngine.shared.isEnabled = isAudioEnabled
    }
    
    // MARK: - Act I Actions
    
    func selectTicket(mode: SessionMode) {
        guard !isTearingTicket else { return }
        
        tornTicketMode = mode
        sessionMode = mode
        isTearingTicket = true
        
        // Audio: Scissor snip + tear
        SoundEngine.shared.play(.snip)
        
        // Haptic feedback
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        
        // Animate tear and open curtains into Act II
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { [weak self] in
            SoundEngine.shared.play(.whoosh)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self = self else { return }
            self.isTearingTicket = false
            self.tornTicketMode = nil
            self.currentAct = .booth
            self.cameraManager.startSession()
        }
    }
    
    // MARK: - Act II Actions (Capture & Film Spool)
    
    func setFilter(_ filter: FilterType) {
        activeFilter = filter
        SoundEngine.shared.play(.click)
    }
    
    func startCountdownAndCapture() {
        guard !isCapturing, capturedPhotos.count < 3 else { return }
        isCapturing = true
        countdownNumber = 3
        SoundEngine.shared.play(.beep)
        
        countdownTimer?.invalidate()
        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            Task { @MainActor in
                if let count = self.countdownNumber, count > 1 {
                    self.countdownNumber = count - 1
                    SoundEngine.shared.play(.beep)
                } else {
                    timer.invalidate()
                    self.countdownNumber = nil
                    self.executeShutterFlash()
                }
            }
        }
    }
    
    private func executeShutterFlash() {
        // Double flash & shutter click sound
        isFlashing = true
        SoundEngine.shared.play(.click)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            self?.isFlashing = false
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) { [weak self] in
            self?.isFlashing = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.26) { [weak self] in
            self?.isFlashing = false
        }
        
        // Capture photo frame from camera manager
        cameraManager.capturePhoto { [weak self] rawImage in
            guard let self = self, let raw = rawImage else { return }
            
            // Apply current tone filter
            let filtered = FilterModel.applyFilter(self.activeFilter, to: raw)
            
            let photo = PhotoModel(
                image: filtered,
                filterApplied: self.activeFilter,
                frameIndex: self.capturedPhotos.count,
                caption: "",
                stickers: []
            )
            
            self.capturedPhotos.append(photo)
            self.activeBenchIndex = self.capturedPhotos.count - 1
            self.currentShotIndex = min(self.capturedPhotos.count, 2)
            self.isCapturing = false
            
            // Audio: Thunk as polaroid drops onto the bench
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                SoundEngine.shared.play(.thunk)
            }
        }
    }
    
    func updateCaption(for index: Int, text: String) {
        guard index < capturedPhotos.count else { return }
        // Restrict to 45 chars like web app
        let trimmed = String(text.prefix(45))
        capturedPhotos[index].caption = trimmed
    }
    
    func addSticker(to photoIndex: Int, type: StickerType) {
        guard photoIndex < capturedPhotos.count else { return }
        
        // Slight random rotation between -12 and +12 degrees
        let randomDeg = Double.random(in: -12.0...12.0)
        let newSticker = StickerInstance(
            type: type,
            position: CGPoint(x: 0.5, y: 0.5),
            scale: 1.0,
            rotation: Angle(degrees: randomDeg)
        )
        
        capturedPhotos[photoIndex].stickers.append(newSticker)
        SoundEngine.shared.play(.click)
    }
    
    func updateSticker(photoIndex: Int, stickerId: UUID, position: CGPoint, scale: CGFloat, rotation: Angle) {
        guard photoIndex < capturedPhotos.count,
              let idx = capturedPhotos[photoIndex].stickers.firstIndex(where: { $0.id == stickerId }) else { return }
        
        capturedPhotos[photoIndex].stickers[idx].position = position
        capturedPhotos[photoIndex].stickers[idx].scale = scale
        capturedPhotos[photoIndex].stickers[idx].rotation = rotation
    }
    
    func removeSticker(photoIndex: Int, stickerId: UUID) {
        guard photoIndex < capturedPhotos.count else { return }
        capturedPhotos[photoIndex].stickers.removeAll(where: { $0.id == stickerId })
        SoundEngine.shared.play(.click)
    }
    
    // MARK: - Act III Actions (Mechanical Printer)
    
    func proceedToPrinter() {
        guard capturedPhotos.count >= 3 else { return }
        
        // Stop camera session to conserve power
        cameraManager.stopSession()
        
        // Pre-render the high-res strip image using StripRenderer
        let rendered = StripRenderer.shared.renderStrip(
            photos: capturedPhotos,
            mode: sessionMode,
            roomCode: roomCode
        )
        self.renderedStripImage = rendered
        
        // Transition to Act III
        currentAct = .printer
        printProgress = 0.0
        isPrinterVibrating = true
        isMotorActive = true
        isPrintReady = false
        slotJitter = 0.0
        
        SoundEngine.shared.play(.arrive)
        
        // Start mechanical emergence sequence (5.5 seconds)
        runMechanicalPrinterSequence()
    }
    
    private func runMechanicalPrinterSequence() {
        let totalDuration: Double = 5.5
        let interval: Double = 0.05
        let totalSteps = totalDuration / interval
        var currentStep: Double = 0
        
        printerTimer?.invalidate()
        printerTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            Task { @MainActor in
                currentStep += 1
                let progress = min(currentStep / totalSteps, 1.0)
                self.printProgress = progress
                
                // Stepper motor ticking audio every 4 steps (~200ms)
                if Int(currentStep) % 4 == 0 && progress < 0.95 {
                    SoundEngine.shared.play(.tick)
                }
                
                // Micro-jitter of the emerging sheet
                if progress < 0.98 {
                    self.slotJitter = CGFloat.random(in: -1.2...1.2)
                } else {
                    self.slotJitter = 0.0
                }
                
                // Complete emergence
                if progress >= 1.0 {
                    timer.invalidate()
                    self.isPrinterVibrating = false
                    self.isMotorActive = false
                    self.slotJitter = 0.0
                    self.isPrintReady = true
                    
                    // Final mechanical ding
                    SoundEngine.shared.play(.ding)
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                }
            }
        }
    }
    
    // MARK: - Act IV Actions (Memory Desk)
    
    func takeStrip() {
        guard isPrintReady else { return }
        
        SoundEngine.shared.play(.whoosh)
        currentAct = .memory
        hasDroppedMemoryPaper = false
        isPostmarkStamped = false
        
        // Paper drop animation on the desk
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                self?.hasDroppedMemoryPaper = true
            }
            SoundEngine.shared.play(.thunk)
        }
        
        // Postmark stamp imprint
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            withAnimation(.easeOut(duration: 0.2)) {
                self?.isPostmarkStamped = true
            }
            SoundEngine.shared.play(.stamp)
        }
    }
    
    func printPhysicalStrip() {
        guard let strip = renderedStripImage else { return }
        SoundEngine.shared.play(.click)
        PrintManager.shared.printStrip(image: strip)
    }
    
    func saveStripToLibrary() {
        guard let strip = renderedStripImage else { return }
        SoundEngine.shared.play(.click)
        
        PrintManager.shared.saveToPhotos(image: strip) { [weak self] success, error in
            if success {
                SoundEngine.shared.play(.stamp)
                self?.saveNotificationMessage = "Saved strip to Photos!"
            } else {
                self?.saveNotificationMessage = error?.localizedDescription ?? "Could not save photo."
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                self?.saveNotificationMessage = nil
            }
        }
    }
    
    func shareStrip() {
        guard let strip = renderedStripImage else { return }
        SoundEngine.shared.play(.click)
        PrintManager.shared.shareStrip(image: strip)
    }
    
    func startOver() {
        SoundEngine.shared.play(.click)
        
        countdownTimer?.invalidate()
        printerTimer?.invalidate()
        
        capturedPhotos.removeAll()
        currentShotIndex = 0
        activeBenchIndex = 0
        printProgress = 0.0
        isPrintReady = false
        hasDroppedMemoryPaper = false
        isPostmarkStamped = false
        renderedStripImage = nil
        roomCode = RoomCodeGenerator.generate()
        
        currentAct = .curtains
    }
}
