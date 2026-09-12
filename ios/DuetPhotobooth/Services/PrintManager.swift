//
//  PrintManager.swift
//  DuetPhotobooth
//
//  Handles physical AirPrint interaction, saving to Photos album,
//  and system share sheet coordination.
//

import UIKit
import Photos

@MainActor
final class PrintManager: NSObject, ObservableObject {
    static let shared = PrintManager()
    
    @Published var isPrinting = false
    @Published var saveSuccess: Bool? = nil
    @Published var errorMessage: String? = nil
    
    private override init() {
        super.init()
    }
    
    /// Trigger AirPrint dialog to print the high-res 300 DPI photo strip on a physical printer
    func printStrip(image: UIImage) {
        guard UIPrintInteractionController.isPrintingAvailable else {
            self.errorMessage = "Printing is not available on this device."
            return
        }
        
        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .photo
        printInfo.jobName = "Duet Photobooth Strip"
        printInfo.orientation = .portrait
        
        let printController = UIPrintInteractionController.shared
        printController.printInfo = printInfo
        printController.printingItem = image
        printController.showsNumberOfCopies = true
        
        self.isPrinting = true
        
        printController.present(animated: true) { [weak self] controller, completed, error in
            Task { @MainActor in
                self?.isPrinting = false
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    /// Save high-res strip to the user's Photos library
    func saveToPhotos(image: UIImage, completion: @escaping (Bool, Error?) -> Void) {
        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        
        switch status {
        case .authorized, .limited:
            self.performSave(image: image, completion: completion)
        case .notDetermined:
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { newStatus in
                DispatchQueue.main.async {
                    if newStatus == .authorized || newStatus == .limited {
                        self.performSave(image: image, completion: completion)
                    } else {
                        completion(false, NSError(domain: "DuetPhotobooth", code: 1, userInfo: [NSLocalizedDescriptionKey: "Photo library access denied"]))
                    }
                }
            }
        case .denied, .restricted:
            completion(false, NSError(domain: "DuetPhotobooth", code: 2, userInfo: [NSLocalizedDescriptionKey: "Photo library access was denied in Settings"]))
        @unknown default:
            completion(false, NSError(domain: "DuetPhotobooth", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unknown photo library status"]))
        }
    }
    
    private func performSave(image: UIImage, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        }) { success, error in
            DispatchQueue.main.async {
                self.saveSuccess = success
                completion(success, error)
            }
        }
    }
    
    /// Present native iOS Share Sheet (AirDrop, Messages, Instagram, Mail, etc.)
    func shareStrip(image: UIImage) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            return
        }
        
        let activityVC = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        
        // iPad support
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootVC.view
            popover.sourceRect = CGRect(x: rootVC.view.bounds.midX, y: rootVC.view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        // Find topmost presenter
        var topVC = rootVC
        while let presented = topVC.presentedViewController {
            topVC = presented
        }
        
        topVC.present(activityVC, animated: true)
    }
}
