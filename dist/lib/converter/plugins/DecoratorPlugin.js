"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var _ts = require("../../ts-internal");
var index_1 = require("../../models/types/index");
var components_1 = require("../components");
var converter_1 = require("../converter");
var DecoratorPlugin = (function (_super) {
    __extends(DecoratorPlugin, _super);
    function DecoratorPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DecoratorPlugin.prototype.initialize = function () {
        var _a;
        this.listenTo(this.owner, (_a = {},
            _a[converter_1.Converter.EVENT_BEGIN] = this.onBegin,
            _a[converter_1.Converter.EVENT_CREATE_DECLARATION] = this.onDeclaration,
            _a[converter_1.Converter.EVENT_CREATE_PARAMETER] = this.onDeclaration,
            _a[converter_1.Converter.EVENT_RESOLVE] = this.onBeginResolve,
            _a));
    };
    DecoratorPlugin.prototype.extractArguments = function (args, signature) {
        var result = {};
        args.forEach(function (arg, index) {
            if (index < signature.parameters.length) {
                var parameter = signature.parameters[index];
                result[parameter.name] = _ts.getTextOfNode(arg);
            }
            else {
                if (!result['...']) {
                    result['...'] = [];
                }
                result['...'].push(_ts.getTextOfNode(arg));
            }
        });
        return result;
    };
    DecoratorPlugin.prototype.onBegin = function (context) {
        this.usages = {};
    };
    DecoratorPlugin.prototype.onDeclaration = function (context, reflection, node) {
        var _this = this;
        if (!node || !node.decorators) {
            return;
        }
        node.decorators.forEach(function (decorator) {
            var callExpression;
            var identifier;
            switch (decorator.expression.kind) {
                case ts.SyntaxKind.Identifier:
                    identifier = decorator.expression;
                    break;
                case ts.SyntaxKind.CallExpression:
                    callExpression = decorator.expression;
                    identifier = callExpression.expression;
                    break;
                default:
                    return;
            }
            var info = {
                name: _ts.getTextOfNode(identifier)
            };
            var type = context.checker.getTypeAtLocation(identifier);
            if (type && type.symbol) {
                var symbolID = context.getSymbolID(type.symbol);
                info.type = new index_1.ReferenceType(info.name, symbolID);
                if (callExpression && callExpression.arguments) {
                    var signature = context.checker.getResolvedSignature(callExpression);
                    if (signature) {
                        info.arguments = _this.extractArguments(callExpression.arguments, signature);
                    }
                }
                if (!_this.usages[symbolID]) {
                    _this.usages[symbolID] = [];
                }
                _this.usages[symbolID].push(new index_1.ReferenceType(reflection.name, index_1.ReferenceType.SYMBOL_ID_RESOLVED, reflection));
            }
            if (!reflection.decorators) {
                reflection.decorators = [];
            }
            reflection.decorators.push(info);
        });
    };
    DecoratorPlugin.prototype.onBeginResolve = function (context) {
        for (var symbolID in this.usages) {
            if (!this.usages.hasOwnProperty(symbolID)) {
                continue;
            }
            var id = context.project.symbolMapping[symbolID];
            if (!id) {
                continue;
            }
            var reflection = context.project.reflections[id];
            if (reflection) {
                reflection.decorates = this.usages[symbolID];
            }
        }
    };
    DecoratorPlugin = __decorate([
        components_1.Component({ name: 'decorator' })
    ], DecoratorPlugin);
    return DecoratorPlugin;
}(components_1.ConverterComponent));
exports.DecoratorPlugin = DecoratorPlugin;
//# sourceMappingURL=DecoratorPlugin.js.map