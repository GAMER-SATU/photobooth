//
//  FilterModel.swift
//  DuetPhotobooth
//

import SwiftUI
import CoreImage
import CoreImage.CIFilterBuiltins

public enum FilterType: String, CaseIterable, Identifiable, Codable {
    case original = "original"
    case warm = "warm"
    case vintage = "vintage"
    case grain = "grain"
    case mono = "mono"
    case noir = "noir"
    
    public var id: String { rawValue }
    
    public var displayName: String {
        switch self {
        case .original: return "ORIGINAL"
        case .warm: return "WARM"
        case .vintage: return "VINTAGE"
        case .grain: return "GRAIN"
        case .mono: return "MONO"
        case .noir: return "NOIR"
        }
    }
    
    public var swatchColor: Color {
        switch self {
        case .original: return .white
        case .warm: return Color(red: 0xEF/255.0, green: 0xE3/255.0, blue: 0xC8/255.0)
        case .vintage: return Color(red: 0xD8/255.0, green: 0xC4/255.0, blue: 0x9E/255.0)
        case .grain: return Color(red: 0xAB/255.0, green: 0xA7/255.0, blue: 0x9F/255.0)
        case .mono: return Color(white: 0.56)
        case .noir: return Color(white: 0.33)
        }
    }
    
    // CoreImage filter application helper for stills
    public func apply(to image: UIImage) -> UIImage {
        guard self != .original else { return image }
        guard let ciImage = CIImage(image: image) else { return image }
        let context = CIContext(options: nil)
        
        var output = ciImage
        
        switch self {
        case .original:
            return image
            
        case .warm:
            let sepia = CIFilter.sepiaTone()
            sepia.inputImage = output
            sepia.intensity = 0.14
            if let sepiaOut = sepia.outputImage {
                let controls = CIFilter.colorControls()
                controls.inputImage = sepiaOut
                controls.saturation = 1.05
                controls.contrast = 1.02
                if let final = controls.outputImage { output = final }
            }
            
        case .vintage:
            let sepia = CIFilter.sepiaTone()
            sepia.inputImage = output
            sepia.intensity = 0.45
            if let sepiaOut = sepia.outputImage {
                let controls = CIFilter.colorControls()
                controls.inputImage = sepiaOut
                controls.saturation = 0.75
                controls.contrast = 0.95
                controls.brightness = 0.04
                if let final = controls.outputImage { output = final }
            }
            
        case .grain:
            let controls = CIFilter.colorControls()
            controls.inputImage = output
            controls.contrast = 0.94
            controls.brightness = 0.03
            if let out = controls.outputImage { output = out }
            
        case .mono:
            let mono = CIFilter.photoEffectMono()
            mono.inputImage = output
            if let monoOut = mono.outputImage {
                let controls = CIFilter.colorControls()
                controls.inputImage = monoOut
                controls.contrast = 1.08
                if let final = controls.outputImage { output = final }
            }
            
        case .noir:
            let noir = CIFilter.photoEffectNoir()
            noir.inputImage = output
            if let noirOut = noir.outputImage {
                let controls = CIFilter.colorControls()
                controls.inputImage = noirOut
                controls.contrast = 1.28
                controls.brightness = -0.04
                if let final = controls.outputImage { output = final }
            }
        }
        
        if let cgImage = context.createCGImage(output, from: output.extent) {
            return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
        }
        
        return image
    }
}
