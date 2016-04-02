(function() {
    angular.module('altairApp')
        .controller('treatmentsViewAllCtrl', TreatmentsViewAll);

    TreatmentsViewAll.$inject = ['$state', 'DTOptionsBuilder', 'treatmentFactory'];

    function TreatmentsViewAll($state, DTOptionsBuilder, treatmentFactory) {
        var vm = this;
        //  declarations and mappings
        vm.addTreatment = addTreatment;
        vm.editTreatment = editTreatment;
        vm.deleteTreatment = deleteTreatment;
        vm.changeDisplayAs = changeDisplayAs;
        //  datatable instance
        vm.dtInstance = {};
        //  datatable options
        vm.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(10);
        //  treatments array for datatable
        vm.treatments = [];
        //  checkbox for display format
        vm.displayAsList = false;

        //  default execution steps
        refresh();

        //  refresh datatable from database
        function refresh() {
            treatmentFactory.currentTreatmentSettings().then(function(res) {
                if (res)
                    vm.displayAsList = res.displayAsList;
            });
            treatmentFactory.treatmentsAsArray().then(function(res) {
                vm.treatments = res;
            }, function(err) {
                vm.treatments = [];
            });
        }

        //  checkbox listener for display format
        function changeDisplayAs() {
            treatmentFactory.changeDisplayAs(vm.displayAsList).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Settings Saved!", {
                        status: 'success',
                        timeout: 3000
                    });
                } else {
                    vm.displayAsList = !vm.displayAsList;
                    UIkit.notify("Could not save settings at moment.", {
                        status: 'warning',
                        timeout: 3000
                    });
                }
            }, function(err) {
                vm.displayAsList = !vm.displayAsList;
                UIkit.notify("Could not save settings at moment.", {
                    status: 'warning',
                    timeout: 3000
                });
            });
        }

        //  callback for edit service button
        function editTreatment($e, treatment) {
            $state.go('restricted.treatments.edit', {
                name: treatment.name,
            });
        };

        //  callback for delete service button
        function deleteTreatment($e, treatment) {
            treatmentFactory.deleteTreatment(treatment.name).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been deleted.", {
                        status: 'danger',
                        timeout: 3000
                    });
                    refresh();
                } else {
                    UIkit.notify("Treatment can not be deleted at moment. Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be deleted at moment. Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
            });
        }

        //  callback for add service button
        function addTreatment() {
            $state.go('restricted.treatments.add');
        };
    }
})();