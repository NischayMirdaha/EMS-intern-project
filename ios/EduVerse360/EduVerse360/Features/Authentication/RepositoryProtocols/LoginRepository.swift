//
//  LoginAPIProtocol.swift
//  EduVerse360
//
//  Created by Ekta Rai on 12/07/2026.
//

import Foundation
protocol LoginAPIProtocol{
    func login(req: LoginRequest) async throws -> LoginResponse
}
