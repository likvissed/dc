class CreateServiceDependencies < ActiveRecord::Migration
  def change
    create_table :service_dependencies do |t|
      t.references :child,    index: true
      t.references :parent,   index: true
      t.timestamps null: false
    end
  end
end
