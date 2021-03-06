import { ValueKind, BaseValue } from "../values/base-value";
import { NumberValue } from "../values/number-value";
import { LibraryMethodInstance, LibraryTypeInstance, LibraryPropertyInstance, LibraryEventInstance } from "../libraries";
import { ExecutionEngine } from "../../execution-engine";

// TODO: add tests

export interface ITurtleLibraryPlugin {
    getSpeed(): number;
    setSpeed(speed: number): void;
    getAngle(): number;
    setAngle(angle: number): void;

    setX(x: number): void;
    getX(): number;
    setY(y: number): void;
    getY(): number;

    setVisibility(isVisible: boolean): void;
    setPenStatus(isWriting: boolean): void;

    moveTo(x: number, y: number): void;
    turn(angle: number): void;
}

export class TurtleLibrary implements LibraryTypeInstance {
    private _pluginInstance: ITurtleLibraryPlugin | undefined;

    public get plugin(): ITurtleLibraryPlugin {
        if (!this._pluginInstance) {
            throw new Error("Plugin is not set.");
        }

        return this._pluginInstance;
    }

    public set plugin(plugin: ITurtleLibraryPlugin) {
        this._pluginInstance = plugin;
    }

    private getSpeed(): BaseValue {
        return new NumberValue(this.plugin.getSpeed());
    }

    private setSpeed(value: BaseValue): void {
        value = value.tryConvertToNumber();
        if (value.kind === ValueKind.Number) {
            let newSpeed = Math.round((value as NumberValue).value);

            if (newSpeed < 1) {
                newSpeed = 1;
            } else if (newSpeed > 10) {
                newSpeed = 10;
            }

            this.plugin.setSpeed(newSpeed);
        }
    }

    private getAngle(): BaseValue {
        return new NumberValue(this.plugin.getAngle());
    }

    private setAngle(value: BaseValue): void {
        value = value.tryConvertToNumber();
        if (value.kind === ValueKind.Number) {
            this.plugin.setAngle((value as NumberValue).value);
        }
    }

    private getX(): BaseValue {
        return new NumberValue(this.plugin.getX());
    }

    private setX(value: BaseValue): void {
        value = value.tryConvertToNumber();
        if (value.kind === ValueKind.Number) {
            this.plugin.setX((value as NumberValue).value);
        }
    }

    private getY(): BaseValue {
        return new NumberValue(this.plugin.getY());
    }

    private setY(value: BaseValue): void {
        value = value.tryConvertToNumber();
        if (value.kind === ValueKind.Number) {
            this.plugin.setY((value as NumberValue).value);
        }
    }

    private executeSetVisibility(isVisible: boolean): void {
        this.plugin.setVisibility(isVisible);
    }

    private executeSetPenStatus(isWriting: boolean): void {
        this.plugin.setPenStatus(isWriting);
    }

    private executeMove(engine: ExecutionEngine): void {
        const distanceArg = engine.popEvaluationStack().tryConvertToNumber();
        if (distanceArg.kind !== ValueKind.Number) {
        }

        const distance = (distanceArg as NumberValue).value;
        const turnDelta = this.plugin.getAngle() / 180 * Math.PI;

        const newY = this.plugin.getY() - distance * Math.cos(turnDelta);
        const newX = this.plugin.getX() + distance * Math.sin(turnDelta);

        this.plugin.moveTo(newX, newY);
    }

    private executeMoveTo(engine: ExecutionEngine): void {
        const yArg = engine.popEvaluationStack().tryConvertToNumber();
        const xArg = engine.popEvaluationStack().tryConvertToNumber();

        if (yArg.kind !== ValueKind.Number || xArg.kind !== ValueKind.Number) {
            return;
        }

        const newY = (yArg as NumberValue).value;
        const newX = (xArg as NumberValue).value;
        const distanceSquared = (newX - this.plugin.getX()) * (newX - this.plugin.getX()) + (newY - this.plugin.getY()) * (newY - this.plugin.getY());

        if (distanceSquared === 0) {
            return;
        }

        const distance = Math.sqrt(distanceSquared);
        let angle = Math.acos((this.plugin.getY() - newY) / distance) * 180 / Math.PI;

        if (newX < this.plugin.getX()) {
            angle = 360 - angle;
        }

        let turnDelta = angle - (this.plugin.getAngle() % 360);
        if (turnDelta > 180) {
            turnDelta = turnDelta - 360;
        }

        this.plugin.turn(turnDelta);
        this.plugin.moveTo(newX, newY);
    }

    private executeTurn(engine: ExecutionEngine): void {
        const angleArg = engine.popEvaluationStack().tryConvertToNumber();

        if (angleArg.kind !== ValueKind.Number) {
            return;
        }

        const turnDelta = (angleArg as NumberValue).value;
        this.plugin.turn(turnDelta);
    }

    private executeTurnLeft(): void {
        this.plugin.turn(-90);
    }

    private executeTurnRight(): void {
        this.plugin.turn(90);
    }

    public readonly methods: { readonly [name: string]: LibraryMethodInstance } = {
        Show: { execute: () => this.executeSetVisibility.bind(true) },
        Hide: { execute: () => this.executeSetVisibility.bind(false) },
        PenDown: { execute: () => this.executeSetPenStatus(true) },
        PenUp: { execute: () => this.executeSetPenStatus(false) },
        Move: { execute: this.executeMove.bind(this) },
        MoveTo: { execute: this.executeMoveTo.bind(this) },
        Turn: { execute: this.executeTurn.bind(this) },
        TurnLeft: { execute: this.executeTurnLeft.bind(this) },
        TurnRight: { execute: this.executeTurnRight.bind(this) }
    };

    public readonly properties: { readonly [name: string]: LibraryPropertyInstance } = {
        Speed: { getter: this.getSpeed.bind(this), setter: this.setSpeed.bind(this) },
        Angle: { getter: this.getAngle.bind(this), setter: this.setAngle.bind(this) },
        X: { getter: this.getX.bind(this), setter: this.setX.bind(this) },
        Y: { getter: this.getY.bind(this), setter: this.setY.bind(this) }
    };

    public readonly events: { readonly [name: string]: LibraryEventInstance } = {};
}
