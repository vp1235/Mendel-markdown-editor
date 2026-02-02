#!/usr/bin/swift
import Cocoa
import WebKit

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: html-to-pdf <input.html> <output.pdf>\n", stderr)
    exit(1)
}

let htmlPath = CommandLine.arguments[1]
let outPath = CommandLine.arguments[2]

class Delegate: NSObject, WKNavigationDelegate {
    let outPath: String
    let window: NSWindow
    init(_ p: String, _ w: NSWindow) { outPath = p; window = w }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let printInfo = NSPrintInfo()
        printInfo.paperSize = NSSize(width: 595.28, height: 841.89) // A4
        printInfo.topMargin = 56.69    // 20mm
        printInfo.bottomMargin = 56.69
        printInfo.leftMargin = 56.69
        printInfo.rightMargin = 56.69
        printInfo.horizontalPagination = .fit
        printInfo.verticalPagination = .automatic
        printInfo.isHorizontallyCentered = false
        printInfo.isVerticallyCentered = false
        printInfo.jobDisposition = .save
        printInfo.dictionary()[NSPrintInfo.AttributeKey.jobSavingURL] = URL(fileURLWithPath: self.outPath)

        let printOp = webView.printOperation(with: printInfo)
        printOp.showsPrintPanel = false
        printOp.showsProgressPanel = false
        printOp.runModal(for: window, delegate: self, didRun: #selector(printDone), contextInfo: nil)
    }

    @objc func printDone() {
        exit(0)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        fputs("Navigation error: \(error)\n", stderr)
        exit(1)
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

// Hidden off-screen window needed for print operation
let window = NSWindow(contentRect: NSRect(x: -10000, y: -10000, width: 595, height: 842),
                      styleMask: [], backing: .buffered, defer: false)

let webView = WKWebView(frame: window.contentView!.bounds)
window.contentView!.addSubview(webView)

let delegate = Delegate(outPath, window)
webView.navigationDelegate = delegate

let html = try! String(contentsOfFile: htmlPath, encoding: .utf8)
let baseURL = URL(fileURLWithPath: htmlPath).deletingLastPathComponent()
webView.loadHTMLString(html, baseURL: baseURL)

// Safety timeout
DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
    fputs("Timeout after 30s\n", stderr)
    exit(1)
}

app.run()
