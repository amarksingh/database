const Model = require('@ostro/contracts/database/eloquent/model')
const Collection = require('../../collection')
const Pivot = require('../pivot')
const BaseCollection = require('@ostro/contracts/collection/collect');
const { is_object, empty, count, is_null, in_array, collect } = require('@ostro/support/function');
const { lower } = require('@ostro/support/string');
const { intersection, difference } = require('lodash');
class InteractsWithPivotTable {
    async toggle($ids, $touch = true) {
        const $changes = {
            'attached': [],
            'detached': [],
        };

        let $records = this.formatRecordsList(this.parseIds($ids));
        let pivotKeys = await this.newPivotQuery().pluck(this.$relatedPivotKey);
        let rawCurrent = Array.isArray(pivotKeys) ? pivotKeys : (pivotKeys.all ? pivotKeys.all() : []);
        let currentAttached = rawCurrent.map(String);
        let recordKeys = Object.keys($records).map(String);

        let $detach = intersection(recordKeys, currentAttached);

        if (count($detach) > 0) {
            await this.detach($detach, false);

            $changes['detached'] = this.castKeys($detach);
        }

        let $attach = difference(recordKeys, currentAttached);

        if (count($attach) > 0) {
            await this.attach($attach, {}, false);

            $changes['attached'] = this.castKeys($attach);
        }

        if ($touch && (count($changes['attached']) ||
            count($changes['detached']))) {
            await this.touchIfTouching();
        }

        return $changes;
    }

    syncWithoutDetaching($ids) {
        return this.sync($ids, false);
    }

    async sync($ids, $detaching = true) {
        let $changes = {
            'attached': [],
            'detached': [],
            'updated': [],
        }

        let pivotRows = await this.newPivotQuery().pluck(this.$relatedPivotKey);
        let rawCurrent = Array.isArray(pivotRows) ? pivotRows : (pivotRows.all ? pivotRows.all() : []);
        let $current = rawCurrent.map(String);
        let $records = this.formatRecordsList(this.parseIds($ids));
        let recordKeys = Object.keys($records).map(String);

        let $detach = difference($current, recordKeys);

        if ($detaching && count($detach) > 0) {
            await this.detach($detach);

            $changes['detached'] = this.castKeys($detach);
        }

        let newChanges = await this.attachNew($records, $current, false);
        $changes['attached'] = newChanges['attached'] || [];
        $changes['updated'] = newChanges['updated'] || [];

        if (count($changes['attached']) ||
            count($changes['updated']) ||
            count($changes['detached'])) {
            await this.touchIfTouching();
        }

        return $changes;
    }

    syncWithPivotValues($ids, $values, $detaching = true) {
        let records = {};
        for (let id of this.parseIds($ids)) {
            records[id] = $values;
        }
        return this.sync(records, $detaching);
    }

    formatRecordsList($records) {
        let result = {};
        if (Array.isArray($records)) {
            for (let id of $records) {
                result[id] = {};
            }
        } else if (typeof $records === 'object' && $records !== null) {
            for (let [id, attrs] of Object.entries($records)) {
                result[id] = (Array.isArray(attrs) || typeof attrs === 'object') ? attrs : {};
            }
        }
        return result;
    }

    async attachNew($records = {}, $current, $touch = true) {
        const $changes = { 'attached': [], 'updated': [] };
        const currentStrings = (Array.isArray($current) ? $current : []).map(String);
        for (let $id in $records) {
            const $attributes = $records[$id];
            if (!in_array(String($id), currentStrings)) {
                await this.attach($id, $attributes, $touch);

                $changes['attached'].push(this.castKey($id));
            }
            else if (count($attributes) > 0 &&
                await this.updateExistingPivot($id, $attributes, $touch)) {
                $changes['updated'].push(this.castKey($id));
            }
        }
        return $changes;
    }

    updateExistingPivot($id, $attributes, $touch = true) {
        if (this.$using &&
            empty(this.$pivotWheres) &&
            empty(this.$pivotWhereIns) &&
            empty(this.$pivotWhereNulls)) {
            return this.updateExistingPivotUsingCustomClass($id, $attributes, $touch);
        }

        if (in_array(this.updatedAt(), this.$pivotColumns)) {
            $attributes = this.addTimestampsToAttachment($attributes, true);
        }

        const $updated = this.newPivotStatementForId(this.parseId($id)).update(
            this.castAttributes($attributes)
        );

        if ($touch) {
            this.touchIfTouching();
        }

        return $updated;
    }

    async updateExistingPivotUsingCustomClass($id, $attributes, $touch) {
        const attachedPivots = await this.getCurrentlyAttachedPivots();
        const $pivot = attachedPivots
            .where(this.$foreignPivotKey, this.$parent[this.$parentKey])
            .where(this.$relatedPivotKey, this.parseId($id))
            .first();

        const $updated = $pivot ? $pivot.fill($attributes).isDirty() : false;

        if ($updated) {
            await $pivot.save();
        }

        if ($touch) {
            this.touchIfTouching();
        }

        return $updated;
    }

    attach($id = [], $attributes = {}, $touch = true) {
        const fn = async () => {
            if (this.$using) {
                await this.attachUsingCustomClass($id, $attributes);
            } else {
                await this.newPivotStatement().insert(this.formatAttachRecords(
                    this.parseIds($id), $attributes
                ));
            }

            if ($touch) {
                this.touchIfTouching();
            }
        };
        if (this.$parent.$exists) {
            return fn();
        }
        this.$parent.setLazyQuery(fn);
    }

    attachUsingCustomClass($id, $attributes) {
        let $records = this.formatAttachRecords(
            this.parseIds($id), $attributes
        );
        let p = []
        for (let $record of $records) {
            p.push(this.newPivot($record, false).save());
        }
        return Promise.all(p)

    }

    formatAttachRecords($ids, $attributes) {
        const $records = [];

        let $hasTimestamps = (this.hasPivotColumn(this.createdAt()) ||
            this.hasPivotColumn(this.updatedAt()));
        for (let $id of $ids) {
            $records.push(this.formatAttachRecord(
                $id, $attributes, $hasTimestamps
            ));
        }

        return $records;
    }

    formatAttachRecord($id, $attributes, $hasTimestamps) {
        return Object.assign(
            this.baseAttachRecord($id, $hasTimestamps), this.castAttributes($attributes)
        );
    }

    extractAttachIdAndAttributes($key, $value, $attributes) {
        return is_object($value) ?
            [$key, Object.assign($value, $attributes)] :
            [$value, $attributes];
    }

    baseAttachRecord($id, $timed) {
        let $record = {}
        $record[this.$relatedPivotKey] = $id;

        $record[this.$foreignPivotKey] = this.$parent[this.$parentKey];

        if ($timed) {
            $record = this.addTimestampsToAttachment($record);
        }
        return $record;
    }

    addTimestampsToAttachment($record, $exists = false) {
        let $fresh = this.$parent.freshTimestampString();

        if (this.$using) {
            const $pivotModel = new this.$using;

            $fresh = $fresh.format ? $fresh.format($pivotModel.getDateFormat()) : $fresh;
        }

        if (!$exists && this.hasPivotColumn(this.createdAt())) {
            $record[this.createdAt()] = $fresh;
        }

        if (this.hasPivotColumn(this.updatedAt())) {
            $record[this.updatedAt()] = $fresh;
        }

        return $record;
    }

    hasPivotColumn($column) {
        return in_array($column, this.$pivotColumns);
    }

    detach($ids = null, $touch = true) {
        let $results = 0;
        if (this.$using &&
            !empty($ids) &&
            empty(this.$pivotWheres) &&
            empty(this.$pivotWhereIns) &&
            empty(this.$pivotWhereNulls)) {
            $results = this.detachUsingCustomClass($ids);
        } else {
            let $query = this.newPivotQuery();

            if (!is_null($ids)) {
                $ids = this.parseIds($ids);

                if (empty($ids)) {
                    return 0;
                }

                $query.whereIn(this.getQualifiedRelatedPivotKeyName(), $ids);
            }

            $results = $query.delete();
        }

        if ($touch) {
            this.touchIfTouching();
        }

        return $results;
    }

    detachUsingCustomClass($ids) {
        let $results = 0;

        for (let $id of this.parseIds($ids)) {
            $results += this.newPivot({
                [this.$foreignPivotKey]: this.$parent[this.$parentKey],
                [this.$relatedPivotKey]: $id,
            }, true).delete();
        }

        return $results;
    }

    async getCurrentlyAttachedPivots() {
        const records = await this.newPivotQuery().get();
        return collect(records.map(($record) => {
            const $class = this.$using || Pivot;

            let $pivot = $class.fromRawAttributes(this.$parent, $record, this.getTable(), true);

            return $pivot.setPivotKeys(this.$foreignPivotKey, this.$relatedPivotKey);
        }));
    }

    newPivot($attributes = [], $exists = false) {
        const $pivot = this.$related.newPivot(
            this.$parent, $attributes, this.$table, $exists, this.$using
        );

        return $pivot.setPivotKeys(this.$foreignPivotKey, this.$relatedPivotKey);
    }

    newExistingPivot($attributes = []) {
        return this.newPivot($attributes, true);
    }

    newPivotStatement() {
        return this.newQuery().getQuery().from(this.$table);
    }

    newPivotStatementForId($id) {
        return this.newPivotQuery().whereIn(this.$relatedPivotKey, this.parseIds($id));
    }

    newPivotQuery() {
        let $query = this.newPivotStatement();

        for (let $arguments of this.$pivotWheres) {
            $query.where(...$arguments);
        }

        for (let $arguments of this.$pivotWhereIns) {
            $query.whereIn(...$arguments);
        }

        for (let $arguments of this.$pivotWhereNulls) {
            $query.whereNull(...$arguments);
        }

        return $query.where(this.getQualifiedForeignPivotKeyName(), this.$parent[this.$parentKey]);
    }

    withPivot($columns) {
        this.$pivotColumns = this.$pivotColumns.concat(
            Array.isArray($columns) ? $columns : [...arguments]
        );

        return this;
    }

    parseIds($value) {
        if ($value instanceof Model) {
            return [$value[this.$relatedKey]];
        }

        if ($value instanceof Collection || (typeof $value?.pluck === 'function' && typeof $value?.all === 'function' && $value.first() instanceof Model)) {
            return $value.pluck(this.$relatedKey).all();
        }

        if ($value instanceof BaseCollection || (typeof $value?.toArray === 'function' && !Array.isArray($value))) {
            return $value.toArray();
        }

        if (typeof $value === 'object' && $value !== null && !Array.isArray($value)) {
            return $value;
        }

        return Array.isArray($value) ? $value : (is_null($value) ? [] : [$value]);
    }

    parseId($value) {
        return $value instanceof Model ? $value[this.$relatedKey] : $value;
    }

    castKeys($keys) {
        return (Array.isArray($keys) ? $keys : []).map(($v) => {
            return this.castKey($v);
        });
    }

    castKey($key) {
        return this.getTypeSwapValue(
            this.$related.getKeyType(),
            $key
        );
    }

    castAttributes($attributes) {
        return this.$using ?
            this.newPivot().fill($attributes).getAttributes() :
            $attributes;
    }

    getTypeSwapValue($type, $value) {
        switch (lower($type)) {
            case 'int':
            case 'integer':
                return parseInt($value);
            case 'real':
            case 'float':
            case 'double':
                return $value;
            case 'string':
                return String($value);
            default:
                return $value;
        }
    }
}
module.exports = InteractsWithPivotTable
